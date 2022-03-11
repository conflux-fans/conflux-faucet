import Vue from "vue";
import VueI18n from "vue-i18n";

Vue.use(VueI18n);

const messages = {
  en: {
    message: {
      title: "Conflux Testnet Faucet",
      selectToken: 'Select Token',
      selectText: "Click or type to select token",
      claim: 'CLAIM',
      successClaim: 'Successfully claimed the token!',
      connect: 'Connect',
      onRequest: "Requesting...",
      currentAccountAddress: 'Current Account Address',
      toConfluxScan: 'Go to ConfluxScan',
      latestOperationStatus: 'Latest Operation Status',
      ok: 'OK',
      token: 'Token',
      operationType: 'Operation',
      tokenAmount: 'Amount',
      transactionHash: 'Transaction Hash',
      operator: 'Operator',
      tokenContractAddress: 'Token Address',
      currentTransactionStatus: 'Current Transaction Status',
      error: {
        networkError: 'Network Error',
        error: "ERROR",
        transactionError: 'Transaction Error',
        installationError: 'ConfluxPortal or Fluent Wallet Not Detected',
      },
      warning: {
        connectionWarning: 'Please connect to your wallet',
        tokenWarning: 'Please select token',
        changeNetworkWarning: 'Please change network to Conflux Testnet in your wallet.',
        networkLoadingWarning: 'Network status is on loading or unofficial network is in use，please check it in your wallet'
      },
      tooltip: {
        networkTooltip: 'Change network in yout wallet',
        faucet: {
          frequency: {
            beg: 'Conflux Testnet Faucet is available every ',
            mid: ' for {token}. Faucet drips ',
            end: ' {token} for each claim',
          },
          portal: {
            beg: "Chrome extension ",
            end: " is required for Conflux Testnet Faucet",
          }
        },
        successClaim: 'Transaction is executed, but not confirmed.'
      }
    },
  },
  "zh-CN": {
      message:{
        title: "Conflux 测试网水龙头",
        selectToken: '代币选择',
        selectText: "下拉选择或键入搜索",
        claim: '领取',
        successClaim: '领取成功！',
        connect: '连接钱包',
        onRequest: "请求中...",
        currentAccountAddress: '当前账户地址',
        toConfluxScan: '在 ConfluxScan 上查看',
        latestOperationStatus: '最新操作状态',
        ok: '确认',
        token: '代币',
        operationType: '操作类型',
        tokenAmount: '代币数',
        transactionHash: '交易哈希',
        operator: '操作者',
        tokenContractAddress: '代币合约地址',
        currentTransactionStatus: '当前交易状态',
        error: {
          networkError: '网络错误',
          error: "错误",
          transactionError: '交易执行错误',
          installationError: '未检测到 ConfluxPortal 或 Fluent Wallet',
        },
        warning: {
          connectionWarning: '请连接钱包',
          tokenWarning: '请选择Token',
          changeNetworkWarning: '请在钱包中切换至测试网',
          networkLoadingWarning: '当前网络情况仍在加载中或使用了非官方的测试网络，请在钱包中确认当前网络情况'
        },
        tooltip: {
          networkTooltip: '在钱包中切换网络',
          faucet: {
            frequency: {
              beg: 'Conflux测试网水龙头每 ',
              mid: ' 可以领取一次{token}。每次可领取 ',
              end: ' {token}',
            },
            portal: {
              beg: "使用Conflux测试网水龙头需要安装浏览器插件",
              end: "",
            }
          },
          successClaim: '交易已执行，但尚未确认'
        }
      }
  }
};

const i18n = new VueI18n({
  locale: "zh-CN", // 设置地区
  fallbackLocale: "zh-CN",
  messages, // 设置地区信息
})

export default i18n;
