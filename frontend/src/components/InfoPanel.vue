<template>
  <el-card>
    <ul>
      <li>
        {{ $t("message.tooltip.faucet.frequency.beg")
        }}<el-tag type="warning" size="mini">{{ faucetInterval }}s</el-tag
        >{{ $t("message.tooltip.faucet.frequency.mid", {token})
        }}<el-tag type="success" size="mini">{{ faucetAmount }}</el-tag
        >{{ $t("message.tooltip.faucet.frequency.end", {token}) }}
      </li>
      <li>
        {{ $t("message.tooltip.faucet.portal.beg")
        }}<el-link href="https://fluentwallet.com" type="primary" target="_blank"
          >FluentWallet<i class="el-icon-top-right el-icon--right"></i></el-link
        >{{ $t("message.tooltip.faucet.portal.end") }}
      </li>
    </ul>
  </el-card>
</template>
<script>
export default {
  name: "InfoPanel",
  props: ["faucetAmount", "faucetInterval", 'selectedToken'],
  computed: {
    token() {
      return this.selectedToken ? this.selectedToken : "CFX"
    }
  }
};
</script>
<style scoped>
li {
  padding: 10px;
  list-style-type: circle;
}
</style>
