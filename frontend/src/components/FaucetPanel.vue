<template>
  <div>
    <el-row type="flex" justify="center">
      <el-col :span="20">
        <el-card shadow="hover">
          <el-row>
            <el-col :span="7">{{ $t("message.selectToken") }}</el-col>
            <el-col :span="11">
              <el-select
                v-model="selectedToken"
                filterable
                :placeholder="$t('message.selectText')"
                size="mini"
                class="full-width"
                :disabled="!isFreeState"
              >
                <el-option
                  v-for="item in options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  :disabled="item.disabled"
                >
                </el-option>
              </el-select>
            </el-col>
            <el-col :offset="1" :span="3">
              <el-tooltip
                class="item"
                effect="dark"
                :content="claimWarning"
                placement="bottom-start"
                :disabled="!isButtonDisabled"
              >
                <div>
                  <el-button type="primary" size="mini" :disabled="isButtonDisabled" @click="claim">
                    {{ $t("message.claim") }}
                  </el-button>
                </div>
              </el-tooltip>
            </el-col>
          </el-row>

          <el-row type="flex" v-if="isDev">
            <el-col :span="7">代币余额</el-col>
            <el-col :span="10">
              <div class="full-width">
                {{ queryingBalance }}
              </div>
            </el-col>
            <el-col :span="1">
              <el-tooltip
                v-if="isNativeToken ? cfxBalance : tokenBalance"
                class="item"
                effect="dark"
                :content="isNativeToken ? cfxBalance : tokenBalance"
                placement="right"
              >
                <div class="right-align bold-font">
                  <label class="main-background"> ... </label>
                </div>
              </el-tooltip>
            </el-col>
          </el-row>
          <el-divider v-if="isDev"></el-divider>
          <el-row type="flex" v-if="isDev">
            <el-col :span="7">
              代币池余额
              <el-tooltip effect="light" content="代币池余额并非实时更新，用户操作后会进行更新">
                <i class="header-icon el-icon-info"></i>
              </el-tooltip>
            </el-col>
            <el-col :span="10">
              <div class="full-width">
                {{ queryingFaucetBalance }}
              </div>
            </el-col>
            <el-col :span="1">
              <el-tooltip
                v-if="isNativeToken ? faucetCfxBalance : faucetTokenBalance"
                class="item"
                effect="dark"
                :content="isNativeToken ? faucetCfxBalance : faucetTokenBalance"
                placement="right"
              >
                <div class="right-align bold-font">
                  <label class="main-background"> ... </label>
                </div>
              </el-tooltip>
            </el-col>
            <el-col :offset="1" :span="2">
              <el-input
                v-model="depositAmount"
                oninput="value=value.replace(/[^\d]/g,'')"
                size="mini"
                :placeholder="defaultDepositAmount"
              >
              </el-input>
            </el-col>
            <el-col :span="1" v-if="isDev">
              <el-button type="warning" size="mini" :disabled="!isFreeState" @click="deposit">
                deposit
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-row type="flex" justify="center" v-if="!isFreeState || latestTransactionInfo.selectedToken">
      <el-col :span="20">
        <current-transaction-panel
          v-bind:latestTransactionInfo="latestTransactionInfo"
          v-bind:tagTheme="tagTheme"
          v-bind:stateType="stateType"
          v-bind:txState="txState"
          v-on:show-tx-state="showTxState"
        ></current-transaction-panel>
      </el-col>
    </el-row>
    <el-row type="flex" justify="center">
      <el-col :span="20">
        <info-panel
          :faucetAmount="faucetAmount"
          :faucetInterval="faucetInterval"
          :selectedToken="selectedToken ? selectedToken : ''"
        ></info-panel>
      </el-col>
    </el-row>
    <el-dialog
      :visible.sync="executedDialogVisible"
      :title="$t('message.successClaim')"
      width="45%"
      :show-close="false"
    >
      <el-row>
        <span>
          {{ $t("message.transactionHash") }}
          <el-tooltip effect="light" :content="$t('message.tooltip.successClaim')">
            <i class="header-icon el-icon-info"></i> </el-tooltip
          >：
          <el-link :href="scanTransacationUrl" type="primary" target="_blank"
            >{{ latestTransactionInfo.hash }} <i class="el-icon-top-right el-icon--right"></i
          ></el-link>
        </span>
      </el-row>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="executedDialogVisible = false">{{
          $t("message.ok")
        }}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :visible.sync="txStateDialogVisible"
      :title="$t('message.currentTransactionStatus')"
      width="45%"
      :show-close="false"
    >
      <el-row class="no-break">
        {{ stateMessage }}
      </el-row>
    </el-dialog>
  </div>
</template>

<script>
import { tokenConfig, faucetContractConfig } from "../contracts-config";
import { TxState, ErrorType } from "../enums";
import CurrentTransactionPanel from "./CurrentTransactionPanel.vue";
import InfoPanel from "./InfoPanel";
import { getScanUrl } from "../utils";

export default {
  components: {
    InfoPanel,
    CurrentTransactionPanel
  },
  name: "FaucetPanel",
  data() {
    return {
      selectedToken: "",
      depositAmount: "",
      defaultDepositAmount: "10",

      /* this.contract 为当前选择的 token 对应的合约对象
       this.contract.address 为对应的地址，特殊的，选择CFX时该 address 为 0 地址
       使用计算属性是比较直观的行为，但是有部分其他计算属性依赖 this.contract，如果使用计算属性可能会造成奇怪的报错
       因此这里没有将 contract 作为计算属性

       同时，this.contract 的行为较为简单：该变量只会在选择 selectedToken 后更改，不会造成太麻烦的影响
      */
      contract: null,

      /*
       开发模式使用的变量 用于显示当前账户的余额与代币池余额
      */
      tokenBalance: null,
      faucetCfxBalance: null,
      faucetTokenBalance: null,

      /*
        水龙头对应代币但领取间隔和领取量 初始状态会获取CFX对应的取值
        更改 Token 后会更新
      */
      faucetInterval: null,
      faucetAmount: null,

      // 标识当前交易的状态
      txState: TxState.NoTask,
      latestTransactionInfo: {
        hash: null,
        selectedToken: null,
        tokenAddress: null,
        chainId: null,
        timestamp: null,
        from: null,
        isClaim: null,
        amount: null
      },

      errors: {
        transactionError: null,
        balanceError: null
      },
      tagTheme: "dark",

      executedDialogVisible: false,
      txStateDialogVisible: false,
    };
  },
  computed: {
    scanTransacationUrl() {
      if (!this.latestTransactionInfo) return "";
      return getScanUrl(this.latestTransactionInfo.hash, "transaction", this.chainId);
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
    chainId() {
      return this.$store.state.chainId || this.conflux?.chainId;
    },
    isNativeToken() {
      return this.selectedToken === "CFX";
    },
    claimWarning() {
      if (!this.account) {
        return this.$t("message.warning.connectionWarning");
      }

      if (!this.selectedToken) {
        return this.$t("message.warning.tokenWarning");
      }

      return null
    },
    queryingBalance() {
      if (!this.isDev) {
        return null
      }

      if (this.isNativeToken) {
        return this.cfxBalance === null
          ? this.$t("message.warning.connectionWarning")
          : this.sdk.Drip(this.cfxBalance).toCFX();
      }

      if (!this.account) {
        return this.$t("message.warning.connectionWarning");
      }

      if (!this.selectedToken) {
        return this.$t("message.warning.tokenWarning");
      }

      // tokenBalance is updated using async function
      // check tokenBalance before presenting value
      return this.tokenBalance
        ? this.sdk.Drip(this.tokenBalance).toCFX()
        : this.$t("message.onRequest");
    },
    queryingFaucetBalance() {
      if (!this.isDev) {
        return null
      }

      if (this.isNativeToken) {
        return this.faucetCfxBalance === null
          ? this.$t("message.onRequest")
          : this.sdk.Drip(this.faucetCfxBalance).toCFX();
      }

      if (!this.selectedToken) {
        return this.$t("message.warning.tokenWarning");
      }

      // tokenBalance is updated using async function
      // check tokenBalance before presenting value
      return this.faucetTokenBalance
        ? this.sdk.Drip(this.faucetTokenBalance).toCFX()
        : this.$t("message.onRequest");
    },
    stateType() {
      switch (this.txState) {
        case TxState.Error:
          return "danger";
        case TxState.Confirmed:
          return "success";
        case TxState.Executed:
        case TxState.Pending:
          return "warning";
        default:
          return "info";
      }
    },
    stateMessage() {
      switch (this.txState) {
        case TxState.Error:
          return TxState.Error + ":" + this.errors["transactionError"].message;
        case TxState.Executed:
          return (
            TxState.Executed +
            ", Not Confirmed yet. TransactionHash: " +
            this.latestTransactionInfo.hash
          );
        default:
          return this.txState;
      }
    },
    isFreeState() {
      return this.txState === TxState.Executed || TxState.isFree(this.txState);
    },

    hasTask() {
      return this.txState !== TxState.NoTask;
    },

    accountConnected() {
      return this.$store.state.account !== null;
    },
    options() {
      const tmp = [];
      if (!tokenConfig) {
        return tmp;
      }
      Object.keys(tokenConfig).forEach(option => {
        tmp.push({
          value: option,
          label: tokenConfig[option].label,
          // not strict equal
          disabled:
            this.$store.state.sdk?.address?.decodeCfxAddress(tokenConfig[option].address)?.netId !=
            this.chainId
        });
      });
      return tmp;
    },
    faucetContract() {
      if (!this.conflux) return null;
      if (parseInt(this.chainId) !== 1) return null;
      return this.confluxJS.Contract(faucetContractConfig[parseInt(this.chainId)]);
    },
    isDev() {
      return this.$store.state.isDev;
    },
    isButtonDisabled() {
      return !this.isFreeState || !Boolean(this.account) || !Boolean(this.selectedToken);
    }
  },
  watch: {
    async account(newVal) {
      if (newVal) {
        await this.updateTokenBalance();
      } else {
        this.resetBalance();
      }
    },
    async faucetContract(newVal) {
      if (newVal) {
        await Promise.all([
          this.updateFaucetCfxBalance(),
          this.updateFaucetInterval(),
          this.updateFaucetAmount(),
        ]);
      }
    },
    async selectedToken(newVal) {
      if (newVal === "CFX") {
        this.contract = { address: tokenConfig[newVal].address };
        await Promise.all([
          this.updateFaucetInterval(),
          this.updateFaucetAmount()
        ])
        return;
      }

      try {
        this.contract = this.confluxJS.Contract(tokenConfig[newVal]);

        await Promise.all([
          this.updateFaucetInterval(),
          this.updateFaucetAmount(),
          this.updateTokenBalance(),
          this.updateFaucetTokenBalance()
        ])
      } catch (e) {
        this.processError(e);
      }
    }
  },
  methods: {
    notifyTxState() {
      if (this.txState === TxState.Executed && this.latestTransactionInfo.isClaim) {
        this.executedDialogVisible = true;
      } else {
        this.$notify({
          title: this.txState,
          type: this.stateType,
          offset: 60,
          duration: 6000
        });
      }
    },
    async authorize() {
      try {
        await this.$store.dispatch("authorize");
        await this.updateTokenBalance();
      } catch (e) {
        this.processError(e);
      }
    },
    showTxState() {
      this.txStateDialogVisible = true;
    },
    async updateTokenBalance() {
      if (!this.isDev) {
        return;
      }

      try {
        if (!this.account || !this.contract || this.isNativeToken) {
          return;
        }

        const tokenBalance = (await this.contract.balanceOf(this.account)).toString();
        this.tokenBalance = tokenBalance;
      } catch (e) {
        e._type = ErrorType.BalanceError;
        throw e;
      }
    },
    async updateFaucetAmount() {
      this.faucetAmount = "...loading...";
      let address;
      if (this.selectedToken == "") {
        // 未选择 Token 时查询 CFX 的 amount
        address = tokenConfig["CFX"].address;
      } else {
        address = this.contract.address;
      }
      this.faucetAmount = this.sdk
        .Drip((await this.faucetContract.getClaimAmount(address)).toString())
        .toCFX();
    },
    async updateFaucetInterval() {
      this.faucetInterval = "...loading...";
      let address;
      if (this.selectedToken == "") {
        // 未选择 Token 时查询 CFX 的 interval
        address = tokenConfig["CFX"].address;
      } else {
        address = this.contract.address;
      }
      this.faucetInterval = (await this.faucetContract.getClaimInterval(address)).toString();
    },
    async updateFaucetCfxBalance() {
      if (!this.isDev) {
        return;
      }

      this.faucetCfxBalance = (
        await this.confluxJS.getBalance(this.faucetContract.address)
      ).toString();
    },
    async updateFaucetTokenBalance() {
      if (!this.isDev) {
        return null
      }

      try {
        if (!this.contract || this.isNativeToken) {
          return;
        }

        const tokenBalance = (
          await this.contract.balanceOf(this.faucetContract.address)
        ).toString();
        this.faucetTokenBalance = tokenBalance;
      } catch (e) {
        e._type = ErrorType.BalanceError;
        throw e;
      }
    },
    fromCfxToDrip(cfx) {
      return this.sdk.Drip.fromCFX(cfx);
    },
    async claim() {
      this.resetLatestTransactionInfo();
      this.txState = TxState.NoTask;
      this.errors[ErrorType.TransactionError] = null;
      try {
        // 重新获取授权
        await this.authorize();

        let pendingTx;
        
        // 这里重新请求一次，面板上显示的值不一定总加载完成了
        // 再请求一次，这里的值基本可以保证和实际领取的值一致
        // 代价是不太能感知到的延迟
        this.latestTransactionInfo.amount = this.sdk
          .Drip((await this.faucetContract.getClaimAmount(this.contract.address)).toString())
          .toCFX();

        const tx = this.faucetContract.claimToken(this.contract.address);

        const estimate = await tx.estimateGasAndCollateral({
          from: this.account
        });

        pendingTx = tx.sendTransaction({
          from: this.account,
          value: 0,
          // gasPrice: 1000000000,
          gas: estimate.gasLimit
        });

        this.latestTransactionInfo.chainId = this.chainId;
        this.latestTransactionInfo.from = this.account;
        this.latestTransactionInfo.isClaim = true;
        this.latestTransactionInfo.selectedToken = this.selectedToken;
        this.latestTransactionInfo.tokenAddress = this.contract.address;
      

        // this step will ask user for authorization
        await pendingTx;
        this.txState = TxState.Pending;

        this.notifyTxState();
        let receipt = await pendingTx.executed();
        this.latestTransactionInfo.hash = receipt.transactionHash;
        this.txState = TxState.Executed;

        // 时间戳设置为执行完成的时间
        this.latestTransactionInfo.timestamp = Date.now();

        await Promise.all([
          this.$store.dispatch("updateCfxBalance"),
          this.updateTokenBalance(),
          this.updateFaucetCfxBalance(),
          this.updateFaucetTokenBalance(),
        ])

        this.notifyTxState();
        receipt = await pendingTx.confirmed();

        // 用户在executed之后就可以操作了
        // 如果用户在未确认之前就已经进行了操作，那么当前交易的哈希就会与本次交易不一致，就不再进行状态变更与提示等操作
        // 否则仍然提示
        if (this.latestTransactionInfo.hash === receipt.transactionHash) {
          this.txState = TxState.Confirmed;
          this.notifyTxState();
        }
      } catch (err) {
        err._type = ErrorType.TransactionError;
        this.processError(err);
      }
    },
    // 用于开发模式
    async deposit() {
      this.resetLatestTransactionInfo();
      this.txState = TxState.NoTask;
      this.errors[ErrorType.TransactionError] = null;
      try {
        // 重新获取授权
        await this.authorize();

        const amount = this.depositAmount ? this.depositAmount : this.defaultDepositAmount;

        let pendingTx;

        if (!this.isNativeToken) {
          const tx = this.contract.transfer(
            this.faucetContract.address,
            this.fromCfxToDrip(amount)
          );

          const estimate = await tx.estimateGasAndCollateral({
            from: this.account
          });

          pendingTx = tx.sendTransaction({
            from: this.account,
            value: 0,
            // gasPrice: 1000000000,
            gas: estimate.gasLimit
          });
        } else {
          pendingTx = this.confluxJS.sendTransaction({
            from: this.account,
            value: this.fromCfxToDrip(amount),
            to: this.faucetContract.address,
            // gasPrice: 1000000000,
            gas: 31000
          });
        }

        this.latestTransactionInfo.chainId = this.chainId;
        this.latestTransactionInfo.from = this.account;
        this.latestTransactionInfo.amount = amount;
        this.latestTransactionInfo.isClaim = false;
        this.latestTransactionInfo.selectedToken = this.selectedToken;
        this.latestTransactionInfo.tokenAddress = this.contract.address;

        // this step will ask user for authorization
        await pendingTx;
        this.txState = TxState.Pending;

        this.notifyTxState();
        let receipt = await pendingTx.executed();
        this.latestTransactionInfo.hash = receipt.transactionHash;
        this.txState = TxState.Executed;

        this.latestTransactionInfo.timestamp = Date.now();

        await Promise.all([
          this.$store.dispatch("updateCfxBalance"),
          this.updateTokenBalance(),
          this.updateFaucetCfxBalance(),
          this.updateFaucetTokenBalance(),
        ])

        this.notifyTxState();
        receipt = await pendingTx.confirmed();

        this.txState = TxState.Confirmed;
        this.notifyTxState();
      } catch (err) {
        err._type = ErrorType.TransactionError;
        this.processError(err);
      }
    },
    processError(err) {
      console.log(err);
      console.log(err._type);
      // balanceError transactionError
      switch (err._type) {
        case ErrorType.BalanceError:
          this.tokenBalance = null;
          this.$store.commit("resetCfxBalance");
          this.errors[err._type] = err;
          this.$alert(err.message, this.$t("message.error.error"));
          break;
        case ErrorType.TransactionError:
          this.errors[err._type] = err;
          this.txState = TxState.Error;
          this.$alert(err.message, this.$t("message.error.transactionError"));
          break;
        default:
      }
    },

    resetBalance() {
      this.tokenBalance = null;
    },
    resetLatestTransactionInfo() {
      this.latestTransactionInfo = {
        hash: null,
        selectedToken: null,
        tokenAddress: null,
        chainId: null,
        timestamp: null,
        from: null,
        isClaim: null,
        amount: null
      };
    }
  }
};
</script>

<style scoped>
</style>
