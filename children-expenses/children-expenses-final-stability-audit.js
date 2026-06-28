/*
 * PETATOE v6.4.42 — CHX4 Final Children Expenses Stability Audit
 * SAFE / AUDIT ONLY
 *
 * Purpose:
 * - Validate Children Expenses layers after CHX3 controlled migration.
 * - Read and report runtime readiness only.
 * - No behavior ownership transfer.
 * - No Storage, Router, Loader, Reports, Payroll, Operations changes.
 */
(function(window, document){
    'use strict';

    var AUDIT_NAME = 'CHX4_FINAL_CHILDREN_EXPENSES_STABILITY_AUDIT';
    var VERSION = '6.4.42';

    function exists(path){
        try {
            var parts = String(path || '').split('.');
            var ref = window;
            for(var i = 0; i < parts.length; i += 1){
                if(!parts[i]){ continue; }
                ref = ref[parts[i]];
                if(ref === undefined || ref === null){ return false; }
            }
            return true;
        } catch(_err){
            return false;
        }
    }

    function typeOf(path){
        try {
            var parts = String(path || '').split('.');
            var ref = window;
            for(var i = 0; i < parts.length; i += 1){
                if(!parts[i]){ continue; }
                ref = ref[parts[i]];
            }
            return typeof ref;
        } catch(_err){
            return 'missing';
        }
    }

    function elementExists(selector){
        try { return !!document.querySelector(selector); }
        catch(_err){ return false; }
    }

    var runtimeChecks = [
        { key:'core', label:'PETATOEChildrenExpenses core namespace', path:'PETATOEChildrenExpenses' },
        { key:'facade', label:'CHX2 facade namespace', path:'PETATOEChildrenExpensesFacade' },
        { key:'controlledMigration', label:'CHX3 controlled migration namespace', path:'PETATOEChildrenExpensesControlledMigration' },
        { key:'safeRender', label:'SafeRender availability', path:'PETATOESafeRender' },
        { key:'router', label:'Router availability', path:'PETATOERouter' }
    ];

    var domChecks = [
        { key:'root', selector:'#childrenExpensesPage, [data-section="childrenExpenses"], [data-route="childrenExpenses"]' },
        { key:'budgetPanel', selector:'[data-children-expenses-panel="budget"]' },
        { key:'entryPanel', selector:'[data-children-expenses-panel="entry"]' },
        { key:'logPanel', selector:'[data-children-expenses-panel="log"]' },
        { key:'tableBody', selector:'#childrenExpensesBody' }
    ];

    function validate(){
        var runtime = runtimeChecks.map(function(item){
            return {
                key: item.key,
                label: item.label,
                path: item.path,
                exists: exists(item.path),
                type: typeOf(item.path)
            };
        });

        var dom = domChecks.map(function(item){
            return {
                key: item.key,
                selector: item.selector,
                exists: elementExists(item.selector)
            };
        });

        var requiredRuntimeOk = runtime.filter(function(item){
            return item.key === 'core' || item.key === 'facade' || item.key === 'controlledMigration';
        }).every(function(item){ return item.exists; });

        return {
            audit: AUDIT_NAME,
            version: VERSION,
            mode: 'SAFE_AUDIT_ONLY',
            requiredRuntimeOk: requiredRuntimeOk,
            runtime: runtime,
            dom: dom,
            warnings: warnings(runtime, dom),
            timestamp: new Date().toISOString()
        };
    }

    function warnings(runtime, dom){
        var list = [];
        runtime.forEach(function(item){
            if((item.key === 'core' || item.key === 'facade' || item.key === 'controlledMigration') && !item.exists){
                list.push('Missing required Children Expenses runtime layer: ' + item.path);
            }
        });
        var activeDom = dom.filter(function(item){ return item.exists; }).length;
        if(activeDom === 0){
            list.push('Children Expenses DOM was not detected. This can be normal if the section is not opened yet.');
        }
        if(!exists('PETATOEChildrenExpensesControlledMigration.rollback')){
            list.push('Rollback helper is not detected on controlled migration layer.');
        }
        return list;
    }

    function snapshot(){
        var result = validate();
        return {
            audit: result.audit,
            version: result.version,
            stable: result.requiredRuntimeOk && result.warnings.filter(function(w){ return w.indexOf('Missing required') === 0; }).length === 0,
            layers: {
                core: exists('PETATOEChildrenExpenses'),
                facade: exists('PETATOEChildrenExpensesFacade'),
                controlledMigration: exists('PETATOEChildrenExpensesControlledMigration'),
                rollback: exists('PETATOEChildrenExpensesControlledMigration.rollback')
            },
            domDetected: result.dom.filter(function(item){ return item.exists; }).map(function(item){ return item.key; }),
            warnings: result.warnings,
            nextRecommendedPhase: 'WHX1_WAREHOUSE_AUDIT_DEPENDENCY_MAP'
        };
    }

    function checklist(){
        return [
            'Open Children Expenses main screen.',
            'Open Budget tab and verify current year/month filters.',
            'Open Add Expense tab and save a small test expense only if safe test data is available.',
            'Open Expenses Log tab and confirm table rows render correctly.',
            'Open Children Reports and annual reports.',
            'Confirm Reports, Payroll, Warehouse, Treasury, and Operations still open normally.',
            'Run PETATOEChildrenExpensesControlledMigration.rollback() only if emergency rollback is needed.'
        ];
    }

    window.PETATOEChildrenExpensesFinalStabilityAudit = {
        validate: validate,
        snapshot: snapshot,
        checklist: checklist
    };
})(window, document);
