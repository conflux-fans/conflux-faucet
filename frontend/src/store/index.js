import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// store 负责记录全局的变量 
// conflux confluxJS sdk 

// account 和 balance

// store 不处理错误
const store = new Vuex.Store({
  state: {
    conflux: null,
    account: null,
    cfxBalance: null,
    confluxJS: null,
    isDev: process.env.NODE_ENV !== 'production',
    chainId: null,
  },
  getters: {
    simplifiedAccount: state => {
      if (!state.account) {
        return null;
      }
      const index = state.account.indexOf(":")
      const prefix = state.account.substr(0, index+4)
      const tail = state.account.substr(state.account.length-4)
      return prefix + "..." + tail
    },
  },
  // mutations 只能为同步事务 异步操作在 actions 内完成
  mutations: {
    init(state, payload) {
      const { conflux, confluxJS, sdk } = payload;
      state.conflux = conflux;
      state.confluxJS = confluxJS;
      state.sdk = sdk;

      state.conflux.on("accountsChanged", (accounts) => {
        console.log("accounts changed");
        console.log(accounts)
        if (accounts.length === 0) {
          store.commit('resetAccount')
          store.commit('resetCfxBalance')
        } else {
          const account = accounts[0]
          store.commit('setAccount', {account})
          store.dispatch('updateCfxBalance')
        }
      })
      if (state.conflux.isFluent) {
        state.conflux.on("connect", async () => {
          const chainId = await state.conflux.request({method: 'cfx_chainId'})
          // console.log(chainId)
          state.chainId = chainId
        })

        state.conflux.on("chainChanged", (chainId) => {
          console.log("chain changed")
          console.log(chainId)
          if (state.chainId && state.chainId != chainId)
            location.reload()
        })
      }
    },
    setAccount(state, payload) {
      state.account = payload.account
    },
    resetAccount(state) {
      state.account = null
    },
    setCfxBalance(state, payload) {
      state.cfxBalance = payload.cfxBalance
    },
    resetCfxBalance(state) {
      state.cfxBalance = null
    },
    changeDev(state) {
      state.isDev ^= 1
    }
  },
  actions: {
    async authorize(context) {
      let accounts;
      if (context.state.conflux.isFluent) {
        accounts = await context.state.conflux.request({method: "cfx_requestAccounts"});
      } else {
        accounts = await context.state.conflux.enable();
      }
      context.commit('setAccount', { 
        account: accounts[0]
      })
      await context.dispatch('updateCfxBalance')
    },
    async updateCfxBalance(context) {
      if (!context.state.isDev) {
        return null
      }

      const cfxBalance = (await context.state.confluxJS.getBalance(context.state.account)).toString()
      context.commit('setCfxBalance', {cfxBalance})
    },
    async init(context, payload) {
      context.commit('init', payload);
    },
  }
})

export default store;