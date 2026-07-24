/* PETATOE v9.4.23 — Phase A3.4 Payroll UI localization additions. */
(function(){
  'use strict';
  var dictionaries=window.PETATOE_I18N_DICTIONARIES=window.PETATOE_I18N_DICTIONARIES||{};
  function merge(target, source){
    Object.keys(source||{}).forEach(function(key){
      var value=source[key];
      if(value&&typeof value==='object'&&!Array.isArray(value)){
        target[key]=target[key]&&typeof target[key]==='object'?target[key]:{};
        merge(target[key],value);
      }else target[key]=value;
    });
    return target;
  }
  var ar={payrollRuntime:{
    workflow:{
      cannotOpenOthers:'لا يمكنك فتح كشف غير خاص بك',
      cannotDeleteApprovedDetailed:'لا يمكن حذف كشف دخل دورة الاعتماد. استخدم إلغاء الاعتماد أولاً ثم احذف المسودة.',
      slipDeleted:'تم حذف كشف الراتب',
      
      employeeApprovedByEmployee:'تمت موافقة الموظف',
      employeeObjectAfterBoardDetailed:'لا يمكن الاعتراض إلا على كشف معتمد مبدئيًا من رئيس مجلس الإدارة',
      enterObjectionReason:'اكتب سبب الاعتراض',
      objectionRecorded:'تم تسجيل الاعتراض',
      employeeHasHistory:'لا يمكن حذف الموظف لوجود كشوف رواتب تاريخية. غيّر حالته إلى موقوف أو مستقيل.',
      rejectionReasonPrompt:'اكتب سبب رفض كشف الراتب',
      rejectionReasonRequired:'سبب الرفض مطلوب',
      cancelReasonPrompt:'اكتب سبب إلغاء الاعتماد',
      cancelReasonRequired:'سبب إلغاء الاعتماد مطلوب',
      paymentReferencePrompt:'اكتب مرجع الصرف',
      paymentReferenceRequired:'مرجع الصرف مطلوب'
    },
    confirm:{deleteSlipPermanent:'حذف كشف الراتب نهائيًا من الرواتب الشهرية؟'},
    config:{jobs:{
      duplicate:'الوظيفة موجودة بالفعل',
      updatedEmployees:'تم تعديل الوظيفة وتحديث الموظفين المرتبطين بها',
      added:'تمت إضافة الوظيفة'
    }},
    viewModel:{
      unspecified:'غير محدد',
      status:{draft:'مسودة',pending_board:'بانتظار اعتماد رئيس مجلس الإدارة',board_approved:'اعتماد مجلس الإدارة',employee_objection:'اعتراض الموظف',employee_approved:'موافقة الموظف',accounts_approved:'اعتماد الحسابات',paid:'تم الصرف',rejected:'مرفوض',cancelled:'ملغي'},
      payment:{mada:'مدد',bank:'تحويل بنكي',cash:'نقدًا',transfer:'تحويل بنكي'},
      metrics:{count:'عدد الكشوف',gross:'إجمالي المستحق',deductions:'إجمالي الخصومات',net:'صافي الرواتب'}
    }
  }};
  var en={payrollRuntime:{
    workflow:{
      cannotOpenOthers:'You cannot open a salary slip that does not belong to you',
      cannotDeleteApprovedDetailed:'An approved salary slip cannot be deleted. Cancel approval first, then delete the draft.',
      slipDeleted:'Salary slip deleted',
      
      employeeApprovedByEmployee:'Employee approval recorded',
      employeeObjectAfterBoardDetailed:'An objection can be submitted only after initial Chairman approval',
      enterObjectionReason:'Enter the objection reason',
      objectionRecorded:'Objection recorded',
      employeeHasHistory:'This employee cannot be deleted because historical salary slips exist. Change the status to Stopped or Resigned.',
      rejectionReasonPrompt:'Enter the salary slip rejection reason',
      rejectionReasonRequired:'A rejection reason is required',
      cancelReasonPrompt:'Enter the approval cancellation reason',
      cancelReasonRequired:'An approval cancellation reason is required',
      paymentReferencePrompt:'Enter the payment reference',
      paymentReferenceRequired:'A payment reference is required'
    },
    confirm:{deleteSlipPermanent:'Permanently delete this salary slip from monthly payroll?'},
    config:{jobs:{
      duplicate:'This job already exists',
      updatedEmployees:'The job was updated for all linked employees',
      added:'Job added'
    }},
    viewModel:{
      unspecified:'Unspecified',
      status:{draft:'Draft',pending_board:'Awaiting Chairman Approval',board_approved:'Chairman Approval',employee_objection:'Employee Objection',employee_approved:'Employee Approval',accounts_approved:'Accounts Approval',paid:'Paid',rejected:'Rejected',cancelled:'Cancelled'},
      payment:{mada:'Mada',bank:'Bank Transfer',cash:'Cash',transfer:'Bank Transfer'},
      metrics:{count:'Salary Slips',gross:'Total Entitlements',deductions:'Total Deductions',net:'Net Payroll'}
    }
  }};
  dictionaries.ar=merge(dictionaries.ar||{},ar);
  dictionaries.en=merge(dictionaries.en||{},en);
})();
