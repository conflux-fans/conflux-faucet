<template>
  <div id="app">
    <el-container style="height: 100%">
      <el-header style="background: #409eff">
        <el-row class="full-height" type="flex" align="middle" justify="left">
          <el-col :span="6">
            <label class="white-font bold-font">{{
              $t("message.title")
            }}</label>
          </el-col>
          <el-col :offset="6" :span="2">
            <el-switch
              style="display: block"
              v-model="isDev"
              active-color="#13ce66"
              inactive-text="开发模式"
              @change="changeDev"
              v-if="isDev"
            >
            </el-switch>
          </el-col>
          <el-col :offset="1" :span="3">
            <el-tag>{{ networkText }}</el-tag>
          </el-col>

          <el-col :span="4" v-if="!accountConnected">
            <el-button class="full-width" round v-on:click="authorize">{{
              $t("message.connect")
            }}</el-button>
          </el-col>
          <el-col :span="4" v-if="accountConnected">
            <el-button class="full-width" type="success" @click="showAccount">
              {{ simplifiedAccount
              }}<i class="el-icon-check el-icon--right"></i>
            </el-button>
          </el-col>
          <el-col :span="2">
            <el-dropdown @command="handleLangCommand" class="full-width">
              <div
                class="el-dropdown-link full-width bold-font right-align"
                style="color: white"
              >
                {{ localeText
                }}<i class="el-icon-arrow-down el-icon--right"></i>
              </div>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="zh-CN">中文</el-dropdown-item>
                <el-dropdown-item command="en">en</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </el-col>
        </el-row>
      </el-header>

      <el-dialog
        :visible.sync="accountDialogVisible"
        :title="$t('message.currentAccountAddress')"
        width="45%"
        :show-close="false"
      >
        <el-row>
          <span>
            <el-link :href="scanAccountUrl" type="primary" target="_blank"
              >{{ account }} <i class="el-icon-top-right el-icon--right"></i
            ></el-link>
          </span>
        </el-row>
      </el-dialog>

      <el-dialog
        :visible.sync="installationDialogVisible"
        :title="$t('message.error.installationError')"
        :close-on-click-modal="false"
        width="45%"
        :show-close="false"
      >
        <el-row>
          {{ $t("message.tooltip.faucet.portal.beg")
          }}<el-link
            href="https://fluentwallet.com"
            type="primary"
            target="_blank"
            >FluentWallet<i
              class="el-icon-top-right el-icon--right"
            ></i></el-link
          >{{ $t("message.tooltip.faucet.portal.end") }}
        </el-row>
      </el-dialog>

      <el-dialog
        :visible.sync="networkDialogVisible"
        :title="$t('message.error.networkError')"
        :close-on-click-modal="false"
        width="45%"
        :show-close="false"
      >
        <el-row class="no-break">
          {{ networkWarning }}
        </el-row>
      </el-dialog>

      <el-main class="main-background">
        <faucet-panel></faucet-panel>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import FaucetPanel from "./components/FaucetPanel.vue";
import { getScanUrl } from "./utils";
import { default as sdk } from "js-conflux-sdk"

export default {
  components: {
    FaucetPanel,
  },
  name: "App",
  data() {
    return {
      isDev: this.$store.state.isDev,
      accountDialogVisible: false,
      installationDialogVisible: false,
      networkDialogVisible: false,
      networkWarning: "",
    };
  },
  computed: {
    scanAccountUrl() {
      return getScanUrl(this.account, "address", this.chainId);
    },
    account() {
      return this.$store.state.account;
    },
    conflux() {
      return this.$store.state.conflux;
    },
    confluxJS() {
      return this.$store.state.confluxJS;
    },
    sdk() {
      return this.$store.state.sdk;
    },
    cfxBalance() {
      return this.$store.state.cfxBalance;
    },
    networkText() {
      switch (this.chainId) {
        case '0x405':
          return "Conflux Tethys";
        case '0x1':
          return "Conflux Testnet";
        case undefined:
          return "Portal Not Detected";
      }

      return "networkId: " + this.chainId;
    },
    chainId() {
      return this.$store.state.chainId || this.conflux?.chainId;
    },
    simplifiedAccount() {
      return this.$store.getters.simplifiedAccount;
    },
    accountConnected() {
      return this.$store.state.account !== null;
    },
    // isDev() {
    //   return this.$store.state.isDev;
    // }
    localeText() {
      switch (this.$i18n.locale) {
        case "zh-CN":
          return "中文";
        default:
          return this.$i18n.locale;
      }
    },
  },
  mounted() {
    // executed immediately after page is fully loaded
    // 如果监测到ConfluxPortal，会挂载ConfluxPortal注入的变量
    // 挂载后会监听 accountChanged 事件
    this.$nextTick(function () {
      if (typeof window.conflux !== "undefined") {
        
        const confluxJS = new sdk.Conflux()
        confluxJS.provider = window.conflux

        this.$store.dispatch("init", {
          conflux: window.conflux,
          confluxJS,
          sdk,
        });
      } else {
        // 没有检测到 ConfluxPortal 注入的变量时会弹出窗口提示安装
        // 且该窗口无法关闭
        this.installationDialogVisible = true;
      }

      // 读取本地化信息
      if (localStorage.locale) {
        this.$i18n.locale = localStorage.locale;
      }
    });
  },
  watch: {
    // conflux.chainId 是异步加载的 这里需要监听该变量的状态
    chainId(newVal) {
      if (newVal === undefined ||  newVal === "0x1") {
        this.networkWarning = ""
        this.networkDialogVisible = false;
        return;
      }

      this.networkDialogVisible = true;
      // 当 Id 为主网 Id 的时候
      if (newVal === '0x405') {
        this.networkWarning = this.$t("message.warning.changeNetworkWarning")
      } else {
        // Portal 加载时 给出加载的提示
        // 也有可能是使用了自行搭建的测试网 不过这里不作区分
        this.networkWarning = this.$t("message.warning.networkLoadingWarning")
      }

    },
  },
  methods: {
    // 选择语言选项时触发的函数
    handleLangCommand(locale) {
      this.$i18n.locale = locale;
      localStorage.locale = locale;
    },
    // 调用 store，变量的管理由store进行（包括account，balance）
    async authorize() {
      try {
        await this.$store.dispatch("authorize");
      } catch (e) {
        this.processError(e);
      }
    },
    processError(err) {
      this.$alert(err.message, this.$t("message.error.error"));
    },
    changeDev() {
      this.$store.commit("changeDev");
    },
    showAccount() {
      this.accountDialogVisible = true;
    },
  },
};
</script>

<style>
html,
body,
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  color: #2c3e50;
  /* margin-top: 60px; */
  padding: 0px;
  margin: 0px;
  height: 100%;
}

.main-background {
  background: #ebeef5;
}

.full-height {
  height: 100%;
}

.full-width {
  width: 100%;
}

.right-align {
  text-align: right;
}

.center-align {
  text-align: center;
}

.bold-font {
  font-weight: bold;
}

.white-font {
  color: white;
}

.el-card {
  margin: 10px;
}

.lang-select {
  background: none;
}

.no-break {
  word-break: normal;
}
</style>
