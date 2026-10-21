"! <p class="shorttext synchronized">BeMind - build PFCG master/derived roles from design</p>
"! Run with ADT "Run as Console Application" (IF_OO_ADT_CLASSRUN).
"! Steps (idempotent - existing objects are skipped, never overwritten):
"!   1. Master role: create, menu = FLP catalog + FLP space, generate auths (org levels '*'), profile
"!   2. Derived role: create, org levels (PT1252), derive from master (adjust auths + profile)
"!   3. Assign derived role + FLP runtime role to the test user (user must exist - created in SU01)
"! Profile-specific values are in the constants section - generated from output/KEY/KEY_design.json.
"! Uses only SAP standard APIs verified in S02 (same sequence as CL_PFCG_FIORI_HELPER).
"! No passwords are handled by this class.
"! KNOWN LIMIT (S02/120): background auth generation is refused with S#/318 because PRGN_STAT has no
"! SU25 step 1/2 entry for the current release. Then finish authorizations in PFCG (dialog): org levels,
"! fill open fields, generate, "Generate derived roles". SU25 must NOT be run without system owner approval.
CLASS z_vot_bemind_role_builder DEFINITION
  PUBLIC FINAL CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.

    "--- Profile: MDM Central - HQ Level (design: output/MDM_HQ/MDM_HQ_design.json) ---
    CONSTANTS c_request      TYPE trkorr     VALUE 'S02K901580'.
    CONSTANTS c_master       TYPE agr_name   VALUE 'Z_VOT_BEMIND_MDM_HQ_ALL'.
    CONSTANTS c_master_text  TYPE agr_title  VALUE 'BeMind - MDM Central HQ Level - all org units'.
    CONSTANTS c_derived      TYPE agr_name   VALUE 'Z_VOT_BEMIND_MDM_HQ_COM1'.
    CONSTANTS c_derived_text TYPE agr_title  VALUE 'BeMind - MDM Central HQ Level - company code COM1'.
    CONSTANTS c_catalog      TYPE agr_url    VALUE 'X-SAP-UI2-CATALOGPAGE:Z_VOT_BEMIND_BC_MDM_HQ?AUTH_DEFAULTS=X&DEST_FES='.
    CONSTANTS c_catalog_text TYPE ssm_title  VALUE 'BeMind - MDM Central HQ'.
    CONSTANTS c_space        TYPE agr_url    VALUE 'Z_VOT_BEMIND_SP_MDM_HQ'.
    CONSTANTS c_space_text   TYPE ssm_title  VALUE 'Master Data Management'.
    CONSTANTS c_user         TYPE xubname    VALUE 'Z_VOT_BM_T1'.
    CONSTANTS c_flp_role     TYPE agr_name   VALUE 'Z_FLP_USER'.
    "! Fill unmaintained (non-org) fields with '*'? Default: no -> open fields reported for review.
    CONSTANTS c_fill_star    TYPE abap_bool  VALUE abap_false.

  PRIVATE SECTION.
    TYPES tt_org TYPE STANDARD TABLE OF pt1252 WITH EMPTY KEY.
    DATA mo_out TYPE REF TO if_oo_adt_classrun_out.

    METHODS role_exists IMPORTING iv_role TYPE agr_name RETURNING VALUE(rv_exists) TYPE abap_bool.
    METHODS log IMPORTING iv_text TYPE csequence.
    METHODS log_return IMPORTING it_return TYPE bapirettab.
    METHODS build_master RETURNING VALUE(rv_ok) TYPE abap_bool.
    METHODS build_master_menu RETURNING VALUE(rv_ok) TYPE abap_bool.
    METHODS build_derived RETURNING VALUE(rv_ok) TYPE abap_bool.
    METHODS get_derived_org_levels RETURNING VALUE(rt_org) TYPE tt_org.
    METHODS assign_user.
    METHODS report_result.
ENDCLASS.


CLASS z_vot_bemind_role_builder IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.
    mo_out = out.
    log( |=== BeMind role builder - client { sy-mandt } - request { c_request } ===| ).
    IF build_master( ) = abap_true.
      IF build_derived( ) = abap_true.
        assign_user( ).
      ENDIF.
    ENDIF.
    report_result( ).
  ENDMETHOD.


  METHOD build_master.
    DATA lt_return TYPE bapirettab.

    IF role_exists( c_master ) = abap_true.
      log( |{ c_master }: exists - skipped (not overwritten)| ).
      rv_ok = abap_true.
      RETURN.
    ENDIF.

    CALL FUNCTION 'PRGN_RFC_CREATE_ACTIVITY_GROUP'
      EXPORTING
        activity_group      = c_master
        activity_group_text = c_master_text
        request             = c_request
        no_dialog           = abap_true
      TABLES
        return              = lt_return
      EXCEPTIONS
        OTHERS              = 1.
    log_return( lt_return ).
    IF sy-subrc <> 0 OR line_exists( lt_return[ type = 'E' ] ) OR line_exists( lt_return[ type = 'A' ] ).
      log( |{ c_master }: CREATE FAILED (subrc { sy-subrc })| ).
      RETURN.
    ENDIF.
    COMMIT WORK AND WAIT.
    log( |{ c_master }: created| ).

    IF build_master_menu( ) = abap_false.
      RETURN.
    ENDIF.

    CLEAR lt_return.
    CALL FUNCTION 'PRGN_AUTO_GENERATE_PROFILE_NEW'
      EXPORTING
        activity_group              = c_master
        no_dialog                   = abap_true
        rebuild_auth_data           = abap_true
        org_levels_with_star        = abap_true
        fill_empty_fields_with_star = c_fill_star
        generate_profile            = abap_true
        request                     = c_request
      TABLES
        return                      = lt_return
      EXCEPTIONS
        OTHERS                      = 1.
    log_return( lt_return ).
    IF sy-subrc <> 0.
      log( |{ c_master }: AUTH/PROFILE GENERATION FAILED (subrc { sy-subrc })| ).
      RETURN.
    ENDIF.
    COMMIT WORK AND WAIT.
    log( |{ c_master }: authorizations generated (org levels '*'), profile generated| ).
    rv_ok = abap_true.
  ENDMETHOD.


  METHOD build_master_menu.
    " Same sequence as CL_PFCG_FIORI_HELPER->COPY_ROLE_MENU (SAP standard)
    DATA lt_hier       TYPE STANDARD TABLE OF agr_hier.
    DATA lt_hiert      TYPE STANDARD TABLE OF agr_hiert.
    DATA lt_buffi      TYPE STANDARD TABLE OF agr_buffi.
    DATA lt_shier_bor  TYPE STANDARD TABLE OF agr_shier_bor.
    DATA lt_tcodes     TYPE STANDARD TABLE OF agr_tcodes.
    DATA lt_error      TYPE bapirettab.
    DATA lv_error_flag TYPE char01.

    " Node 2: FLP catalog (like SAP_BR_* roles: OT / CAT_PROVIDER, folder)
    APPEND VALUE #( mandt = sy-mandt agr_name = c_master object_id = 2 parent_id = 1 folder = abap_true
                    sort_order = 10 reporttype = 'OT' report = 'CAT_PROVIDER' menu_level = 1 attributes = abap_true )
           TO lt_hier.
    APPEND VALUE #( mandt = sy-mandt agr_name = c_master object_id = 2 link_type = 'W' url = c_catalog ) TO lt_buffi.
    APPEND VALUE #( mandt = sy-mandt agr_name = c_master spras = sy-langu object_id = 2 text = c_catalog_text ) TO lt_hiert.
    " Node 3: FLP space (OT / SPACE_PROVIDER)
    APPEND VALUE #( mandt = sy-mandt agr_name = c_master object_id = 3 parent_id = 1
                    sort_order = 20 reporttype = 'OT' report = 'SPACE_PROVIDER' menu_level = 1 attributes = abap_true )
           TO lt_hier.
    APPEND VALUE #( mandt = sy-mandt agr_name = c_master object_id = 3 link_type = 'W' url = c_space ) TO lt_buffi.
    APPEND VALUE #( mandt = sy-mandt agr_name = c_master spras = sy-langu object_id = 3 text = c_space_text ) TO lt_hiert.

    " Resolve catalog content (apps / start authorizations)
    CALL FUNCTION 'PRGN_STRU_CHECK_CATALOG_NODES'
      EXPORTING
        iv_agr_name               = c_master
        iv_delete_apps_of_catalog = abap_true
        iv_frontend_server        = space
      TABLES
        ct_agr_hier               = lt_hier
        ct_agr_hiert              = lt_hiert
        ct_agr_buffi              = lt_buffi
        ct_agr_shier_bor          = lt_shier_bor.

    PERFORM update_cat_apps IN PROGRAM saplprgn_structure
      TABLES lt_hier lt_hiert lt_buffi
      CHANGING lt_error.
    log_return( lt_error ).
    IF line_exists( lt_error[ type = 'E' ] ).
      log( |{ c_master }: MENU - catalog apps could not be resolved| ).
      RETURN.
    ENDIF.

    CLEAR lt_error.
    CALL FUNCTION 'PRGN_STRU_CHECK_APPS_OF_NODES'
      EXPORTING
        iv_agr_name            = c_master
        iv_del_invalid_entries = abap_true
        iv_display_messages    = space
      TABLES
        ct_agr_hier            = lt_hier
        ct_agr_hiert           = lt_hiert
        ct_agr_buffi           = lt_buffi
        ct_agr_shier_bor       = lt_shier_bor
      CHANGING
        ct_return              = lt_error.
    log_return( lt_error ).

    LOOP AT lt_hier INTO DATA(ls_hier) WHERE reporttype = 'TR'.
      APPEND VALUE #( mandt = sy-mandt agr_name = c_master direct = abap_true tcode = ls_hier-report type = 'TR' )
             TO lt_tcodes.
    ENDLOOP.
    SORT lt_tcodes BY agr_name type tcode.
    DELETE ADJACENT DUPLICATES FROM lt_tcodes COMPARING agr_name type tcode.
    PERFORM add_agr_tcodes_for_appl IN PROGRAM saplprgn_structure
      TABLES lt_hier lt_buffi lt_tcodes
      USING sy-mandt.

    CLEAR lt_error.
    CALL FUNCTION 'PRGN_SAVE_ROLE_MENU'
      EXPORTING
        activity_group          = c_master
        enqueue                 = abap_true
        request                 = c_request
      IMPORTING
        error_flag              = lv_error_flag
      TABLES
        nodes                   = lt_hier
        texts                   = lt_hiert
        urls                    = lt_buffi
        tcodes                  = lt_tcodes
        add_details             = lt_shier_bor
        return                  = lt_error
      EXCEPTIONS
        not_authorized          = 1
        activity_group_enqueued = 2
        no_auth_for_tcodes      = 3
        OTHERS                  = 4.
    log_return( lt_error ).
    IF sy-subrc <> 0 OR lv_error_flag = abap_true.
      log( |{ c_master }: MENU SAVE FAILED (subrc { sy-subrc })| ).
      RETURN.
    ENDIF.
    COMMIT WORK AND WAIT.
    log( |{ c_master }: menu saved - { lines( lt_hier ) } nodes, { lines( lt_tcodes ) } start objects| ).
    rv_ok = abap_true.
  ENDMETHOD.


  METHOD build_derived.
    DATA lt_return TYPE bapirettab.
    DATA lt_org    TYPE tt_org.
    DATA lv_deriv_ok   TYPE char01.
    DATA lv_adjust_ok  TYPE char01.
    DATA lv_profile_ok TYPE char01.

    IF role_exists( c_derived ) = abap_true.
      log( |{ c_derived }: exists - skipped (not overwritten)| ).
      rv_ok = abap_true.
      RETURN.
    ENDIF.

    CALL FUNCTION 'PRGN_RFC_CREATE_ACTIVITY_GROUP'
      EXPORTING
        activity_group      = c_derived
        activity_group_text = c_derived_text
        request             = c_request
        no_dialog           = abap_true
      TABLES
        return              = lt_return
      EXCEPTIONS
        OTHERS              = 1.
    log_return( lt_return ).
    IF sy-subrc <> 0 OR line_exists( lt_return[ type = 'E' ] ) OR line_exists( lt_return[ type = 'A' ] ).
      log( |{ c_derived }: CREATE FAILED (subrc { sy-subrc })| ).
      RETURN.
    ENDIF.
    COMMIT WORK AND WAIT.
    log( |{ c_derived }: created| ).

    lt_org = get_derived_org_levels( ).
    CALL FUNCTION 'PRGN_1252_SAVE_ORG_LEVELS'
      EXPORTING
        activity_group = c_derived
      TABLES
        org_levels     = lt_org
      EXCEPTIONS
        OTHERS         = 1.
    IF sy-subrc <> 0.
      log( |{ c_derived }: ORG LEVEL SAVE FAILED (subrc { sy-subrc })| ).
      RETURN.
    ENDIF.
    COMMIT WORK AND WAIT.
    log( |{ c_derived }: { lines( lt_org ) } org level values saved| ).

    CLEAR lt_return.
    CALL FUNCTION 'PRGN_RFC_CREATE_DERIVATION'
      EXPORTING
        role            = c_derived
        parent_role     = c_master
        adjust_auths    = abap_true
        profile_gen     = abap_true
        no_dialog       = abap_true
        request         = c_request
      IMPORTING
        derivation_ok   = lv_deriv_ok
        adjust_auths_ok = lv_adjust_ok
        profile_gen_ok  = lv_profile_ok
      TABLES
        return          = lt_return
      EXCEPTIONS
        OTHERS          = 1.
    DATA(lv_subrc) = sy-subrc.
    log_return( lt_return ).
    COMMIT WORK AND WAIT.
    log( |{ c_derived }: derivation={ lv_deriv_ok } adjust_auths={ lv_adjust_ok } profile={ lv_profile_ok } (subrc { lv_subrc })| ).
    " PRGN_RFC_CREATE_DERIVATION returns 'Y' (not 'X') when OK - verified in S02 on 2026-10-21
    rv_ok = xsdbool( lv_subrc = 0 AND lv_deriv_ok CA 'XY' ).
  ENDMETHOD.


  METHOD get_derived_org_levels.
    " Values from design.json -> roles[DERIVED].orgLevels (sources: T001, T001W/T001K, T024E, TVKO in client 120)
    rt_org = VALUE #( ( varbl = '$BUKRS' low = 'COM1' )
                      ( varbl = '$WERKS' low = '9000' ) ( varbl = '$WERKS' low = '9998' ) ( varbl = '$WERKS' low = '9999' )
                      ( varbl = '$WERKS' low = 'G001' ) ( varbl = '$WERKS' low = 'G002' ) ( varbl = '$WERKS' low = 'G003' )
                      ( varbl = '$WERKS' low = 'GL01' ) ( varbl = '$WERKS' low = 'P001' ) ( varbl = '$WERKS' low = 'P004' )
                      ( varbl = '$WERKS' low = 'PCEN' ) ( varbl = '$WERKS' low = 'PLEH' ) ( varbl = '$WERKS' low = 'POS1' )
                      ( varbl = '$WERKS' low = 'POS2' ) ( varbl = '$WERKS' low = 'POS3' ) ( varbl = '$WERKS' low = 'POS4' )
                      ( varbl = '$WERKS' low = 'POS5' ) ( varbl = '$WERKS' low = 'POS6' ) ( varbl = '$WERKS' low = 'POS7' )
                      ( varbl = '$WERKS' low = 'POS8' ) ( varbl = '$WERKS' low = 'POS9' ) ( varbl = '$WERKS' low = 'PPRD' )
                      ( varbl = '$WERKS' low = 'PQYR' )
                      ( varbl = '$EKORG' low = '9000' ) ( varbl = '$EKORG' low = '9001' ) ( varbl = '$EKORG' low = 'PO01' )
                      ( varbl = '$VKORG' low = 'LA01' ) ( varbl = '$VKORG' low = 'SO01' )
                      ( varbl = '$VTWEG' low = '*' )
                      ( varbl = '$SPART' low = '*' ) ).
  ENDMETHOD.


  METHOD assign_user.
    DATA lt_agr    TYPE STANDARD TABLE OF bapiagr.
    DATA lt_return TYPE bapirettab.

    SELECT SINGLE bname FROM usr02 WHERE bname = @c_user INTO @DATA(lv_user).
    IF sy-subrc <> 0.
      log( |{ c_user }: user does not exist - role assignment skipped (create it in SU01 first)| ).
      RETURN.
    ENDIF.
    " NOTE: BAPI_USER_ACTGROUPS_ASSIGN replaces ALL role assignments of the user
    lt_agr = VALUE #( ( agr_name = c_derived  from_dat = sy-datum to_dat = '99991231' )
                      ( agr_name = c_flp_role from_dat = sy-datum to_dat = '99991231' ) ).
    CALL FUNCTION 'BAPI_USER_ACTGROUPS_ASSIGN'
      EXPORTING
        username       = c_user
      TABLES
        activitygroups = lt_agr
        return         = lt_return.
    log_return( lt_return ).
    IF line_exists( lt_return[ type = 'E' ] ) OR line_exists( lt_return[ type = 'A' ] ).
      CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
      log( |{ c_user }: ROLE ASSIGNMENT FAILED| ).
    ELSE.
      CALL FUNCTION 'BAPI_TRANSACTION_COMMIT' EXPORTING wait = abap_true.
      log( |{ c_user }: assigned { c_derived } + { c_flp_role }| ).
    ENDIF.
  ENDMETHOD.


  METHOD report_result.
    log( |=== Verification ===| ).
    SELECT agr_name, parent_agr FROM agr_define
      WHERE agr_name IN ( @c_master, @c_derived )
      INTO TABLE @DATA(lt_def).
    LOOP AT lt_def INTO DATA(ls_def).
      SELECT COUNT(*) FROM agr_1251 WHERE agr_name = @ls_def-agr_name INTO @DATA(lv_auth).
      SELECT COUNT(*) FROM agr_1251 WHERE agr_name = @ls_def-agr_name AND low = @space AND high = @space
        INTO @DATA(lv_open).
      SELECT SINGLE profile FROM agr_1016 WHERE agr_name = @ls_def-agr_name INTO @DATA(lv_prof).
      log( |{ ls_def-agr_name } parent={ ls_def-parent_agr } auth-values={ lv_auth } open-fields={ lv_open } profile={ lv_prof }| ).
    ENDLOOP.
    " Org level values are stored in AGR_1252 (AGR_1251 only holds the $-variables)
    SELECT varbl, low FROM agr_1252
      WHERE agr_name = @c_derived AND varbl IN ( '$BUKRS', '$EKORG', '$VKORG' )
      INTO TABLE @DATA(lt_org).
    SORT lt_org BY varbl low.
    LOOP AT lt_org INTO DATA(ls_org).
      log( |  { c_derived } { ls_org-varbl } = { ls_org-low }| ).
    ENDLOOP.
    SELECT agr_name FROM agr_users WHERE uname = @c_user INTO TABLE @DATA(lt_users).
    LOOP AT lt_users INTO DATA(ls_user).
      log( |  { c_user } has role { ls_user-agr_name }| ).
    ENDLOOP.
  ENDMETHOD.


  METHOD role_exists.
    SELECT SINGLE agr_name FROM agr_define WHERE agr_name = @iv_role INTO @DATA(lv_role).
    rv_exists = xsdbool( sy-subrc = 0 ).
  ENDMETHOD.


  METHOD log.
    mo_out->write( iv_text ).
  ENDMETHOD.


  METHOD log_return.
    LOOP AT it_return INTO DATA(ls_ret) WHERE type CA 'EAW'.
      log( |  [{ ls_ret-type }] { ls_ret-id }/{ ls_ret-number }: { ls_ret-message }| ).
    ENDLOOP.
  ENDMETHOD.

ENDCLASS.
