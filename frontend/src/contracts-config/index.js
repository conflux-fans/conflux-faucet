import { default as ERC20 } from "../../../build/contracts/IERC20.json";
import { default as faucet } from "../../../build/contracts/Faucet.json";

/*
 options 数组中为支持的代币
 需要新增代币时只需要向 options 数组中增加新的对象即可
*/
const options = [
  {
    /*
    这个地址是测试网的零地址，特殊地，在 Faucet.sol 中该地址会被视为CFX的地址
    使用零地址时往往要小心，零地址作为部分交易的 to 参数时，意味着代币的销毁
    但在水龙头Dapp中，Token合约的地址只被用作水龙头合约部分 claim 的参数

    最坏的情况是该合约被视为ERC20合约，被调用了 ERC20 的相应接口，这最多只会产生抛出一个在开发阶段就容易解决的错误
    */
    address: "cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw",
    label: "CFX",
    symbol: "CFX"
  },
  {
    address: "cfxtest:achkx35n7vngfxgrm7akemk3ftzy47t61yk5nn270s",
    label: "FansCoin",
    symbol: "FC",
  },
  {
    address: "cfxtest:acepe88unk7fvs18436178up33hb4zkuf62a9dk1gv",
    label: "conflux USDT",
    symbol: "cUSDT",
  },
  {
    symbol: "GLD", // 唯一标识符，数组内元素该字段不可重复，会在信息面板显示
    label: "GLD - testnet token", // 前端页面会显示此名称
    address: "cfxtest:ace0ea1x6st1spm1jwfces43tder2yewz2vtx8hxrt" // 要求为 CIP-37 格式的测试网地址
  },
];

// 水龙头合约地址
// 要求为 CIP-37 格式的测试网地址
// 1 cfx each claim, 120s interval
const faucetAddress = "cfxtest:acbwtnr5gyxmf9zp15ha6yvjp60d5eyu5pf012gc4z";

let config = {};
options.forEach(option => {
  config[option.symbol] = {
    abi: ERC20.abi,
    bytecode: ERC20.bytecode,
    address: option.address,
    label: option.label,
    disabled: option.disabled
  };
});

// faucetContractConfig[netId]
const faucetContractConfig = {
  1: { abi: faucet.abi, bytecode: faucet.bytecode, address: faucetAddress },
  // 1029: { abi: faucet.abi, bytecode: faucet.bytecode, address: faucetAddress }
};

export { config, faucetContractConfig };
