// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.8.0;

import "./SponsorWhitelistControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Faucet {
    // lastTokenClaimRecord[tokenContractAddress][msg.sender] = lastClaimTimestamp
    mapping(address => mapping(address => uint256)) lastTokenClaimRecord;

    // 可以使用0地址作为cfx代币的地址，这样不需要多声明一个变量，但暂时先不作更改
    mapping(address => uint256) lastCfxClaimRecord;

    struct ClaimSetting {
        uint256 amount;
        uint256 interval;
    }

    // 每类代币的interval和amount可以单独设置
    // 默认设置为CFX的设置(之后可能会将0地址视为cfx代币的地址，但当前没有)
    // 当前不允许单独设置CFX但领取间隔和时间，但是可以通过修改默认值来进行变更
    mapping(address => ClaimSetting) tokenClaimSettings;

    // 两次领取的间隔
    uint256 public defaultInterval = 3600 seconds;

    // 更改默认Claim token的数量
    uint256 public defaultAmount = 1000 * 1e18;

    address internal _manager;

    // constructor(uint _interval, uint256 _defaultAmount) public {
    constructor() public {
        // defaultInterval = _interval;
        // defaultAmount = _defaultAmount;
        _manager = msg.sender;
        SponsorWhitelistControl cpc =
            SponsorWhitelistControl(0x0888000000000000000000000000000000000001);
        address[] memory a = new address[](1);
        a[0] = address(0);
        cpc.addPrivilege(a);
    }

    modifier onlyManager {
        require(msg.sender == _manager, "Sender is not manager");
        _;
    }

    function changeManager(address newManager) public onlyManager {
        _manager = newManager;
    }

    // for public call
    function getClaimInterval(address tokenContractAddress) public view returns (uint256) {
        uint256 claimInterval = tokenClaimSettings[tokenContractAddress].interval;
        if (claimInterval != 0) {
            return claimInterval;
        }
        return defaultInterval;
    }

    // for public call
    function getClaimAmount(address tokenContractAddress) public view returns (uint256) {
        uint256 claimAmount = tokenClaimSettings[tokenContractAddress].amount;
        if (claimAmount != 0) {
            return claimAmount;
        }
        return defaultAmount;
    }

    function setDefaultIntervalSeconds(uint256 intervalSeconds) public onlyManager {
        defaultInterval = intervalSeconds;
    }

    function setDefaultAmount(uint256 cfxAmount) public onlyManager {
        
        defaultAmount = cfxAmount * 1e18;
    }

    // set to 0 means using default setting
    function setClaimSetting(address tokenContractAddress, uint256 interval, uint256 amountForDecimals, uint256 decimals) public onlyManager {
        tokenClaimSettings[tokenContractAddress].interval = interval;
        tokenClaimSettings[tokenContractAddress].amount = amountForDecimals * (10**decimals);
    }

    function nextCfxClaim() public view returns (uint256) {
        uint256 lastTs = lastCfxClaimRecord[msg.sender];
        if (lastTs == 0 || block.timestamp - lastTs < defaultInterval) {
            return 0;
        } else {
            return block.timestamp - lastTs - defaultInterval;
        }
    }

    function nextTokenClaim(address tokenContractAddress)
        public
        view
        returns (uint256)
    {
        uint256 lastTs = lastTokenClaimRecord[tokenContractAddress][msg.sender];
        uint256 interval = getClaimInterval(tokenContractAddress);
        if (lastTs == 0 || block.timestamp - lastTs < interval) {
            return 0;
        } else {
            return block.timestamp - lastTs - interval;
        }
    }

    function claimToken(address tokenContractAddress) public {
        uint256 lastTs = lastTokenClaimRecord[tokenContractAddress][msg.sender];
        uint256 interval = getClaimInterval(tokenContractAddress);
        uint256 amount = getClaimAmount(tokenContractAddress);

        require(
            block.timestamp - lastTs > interval,
            "Claim Interval too short"
        );
        lastTokenClaimRecord[tokenContractAddress][msg.sender] = block.timestamp;
        IERC20(tokenContractAddress).transfer(msg.sender, amount);
    }

    function claimTokenRegardingSenderBalance(address tokenContractAddress) public {
        uint256 amount = getClaimAmount(tokenContractAddress);
        uint256 balance = IERC20(tokenContractAddress).balanceOf(msg.sender);
        require(
            balance < amount,
            "There is enoungh token balance in sender's wallet"
        );

        uint256 faucetBalance = IERC20(tokenContractAddress).balanceOf(address(this));
        require(
            faucetBalance >= amount,
            "No enough cfx in token pool. Please notify the faucet admin"
        );
        lastTokenClaimRecord[tokenContractAddress][msg.sender] = block.timestamp;
        IERC20(tokenContractAddress).transfer(msg.sender, amount - balance);
    }

    function claimCfx() public payable {
        uint256 lastTs = lastCfxClaimRecord[msg.sender];
        require(
            block.timestamp - lastTs > defaultInterval,
            "Claim Interval too short"
        );
        lastCfxClaimRecord[msg.sender] = block.timestamp;
        
        // will revert if there is no enough cfx balance
        require(
            address(this).balance >= defaultAmount,
            "No enough cfx in token pool. Please notify the faucet admin"
        );
        msg.sender.transfer(defaultAmount);
    }

    function claimCfxRegardingSenderBalance() public payable {
        require(
            msg.sender.balance < defaultAmount,
            "There is enoungh CFX balance in sender's wallet"
        );
        lastCfxClaimRecord[msg.sender] = block.timestamp;
        // will revert if there is no enough cfx balance
        require(
            address(this).balance >= defaultAmount,
            "No enough cfx in token pool. Please notify the faucet admin"
        );
        msg.sender.transfer(defaultAmount - msg.sender.balance);
    }

    // 接受CFX转账时触发
    receive() external payable {}
}
