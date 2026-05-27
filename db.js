// ==========================================
// DB.JS - STANDARD VAULT (V38)
// ==========================================

window.s = null;
const DB_NAME = 'CrewWalletDB';
const STORE_NAME = 'stateStore';

window.db = {
    initDB: function() {
        return new Promise((resolve, reject) => {
            console.log("DB: Opening vault...");
            let request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                let database = e.target.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME);
                    console.log("DB: Vault created.");
                }
            };
            request.onsuccess = (e) => {
                console.log("DB: Vault opened successfully.");
                resolve(e.target.result);
            };
            request.onerror = (e) => {
                console.error("DB: Vault access denied:", e.target.error);
                reject(e.target.error);
            };
        });
    },

    loadState: async function() {
        try {
            let database = await this.initDB();
            let tx = database.transaction(STORE_NAME, 'readonly');
            let store = tx.objectStore(STORE_NAME);
            let request = store.get('master_data');
            request.onsuccess = () => {
                if (request.result) { 
                    window.s = JSON.parse(request.result); 
                    console.log("DB: State loaded from vault.");
                    window.engine.renderApp(); 
                } else { 
                    console.log("DB: No state found, loading pristine.");
                    this.fallbackLoad(); 
                }
            };
            request.onerror = () => this.fallbackLoad();
        } catch (e) { this.fallbackLoad(); }
    },

    fallbackLoad: function() {
        // Only load pristine data if no vault exists
        window.s = { "vault": { "ibkr": 0, "brightwell": 0, "wise": 0, "cash_usd": 0, "cash_tnd": 0, "savings": 0, "ibkr_cash": 0, "ibkr_shares": 0, "ibkr_cost": 0, "ibkr_price": 0 }, "loan": { "arrears": 0, "overdraft": 0, "rate": 13.5, "schedule": [], "targetDate": "" }, "ious": { "payables": [], "receivables": [] }, "history": { "vacation": { "archive": [], "current": [], "limit": 49 }, "onboard": { "archive": [], "current": [], "limit": 7.25 } }, "mode": "vacation", "fx_rate": 2.923, "projects": { "envelopes": {}, "missions": {}, "goals": [] }, "settings": { "pin": "" }, "vape_stash": { "count": 0, "empty_logs": [] }, "custom_categories": [], "income_logs": [], "ledger": [] };
        console.log("DB: Pristine state initialized.");
        window.engine.renderApp();
    },

    forceSaveState: async function() {
        console.log("DB: Saving state...");
        let dataStr = JSON.stringify(window.s);
        try {
            let database = await this.initDB();
            let tx = database.transaction(STORE_NAME, 'readwrite');
            let store = tx.objectStore(STORE_NAME);
            store.put(dataStr, 'master_data');
            console.log("DB: State saved.");
        } catch (e) { console.error("DB: Save failed.", e); }
    },

    saveState: async function() {
        await this.forceSaveState();
        if(window.engine) window.engine.renderApp(); 
    },

    logTransaction: function(type, amount, currency, wallet, details) {
        if(!window.s.ledger) window.s.ledger = [];
        window.s.ledger.push({ id: Date.now(), type, amount, currency, wallet, details, mode: window.s.mode, timestamp: Date.now() });
        this.forceSaveState();
    }
};
