// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./interfaces/IERC20.sol";
import "./lib/LibAsset.sol";
import "./lib/LibUtils.sol";
import "./EmergencyWithdrawable.sol";


contract AssetTransfer is EmergencyWithdrawable {

    // TODO: These are ad hoc values. Confirm or find more suitable ones.
    uint256 private constant ETHER_TRANSFER_GAS_LIMIT = 10000;
    uint256 private constant ERC20_TRANSFER_GAS_LIMIT = 100000;
    uint256 private constant ERC20_BALANCE_GAS_LIMIT = 5000;

    mapping(address => uint256) private _totalTransferred;

    modifier onlySelf() {
        require(
            msg.sender == address(this),
            "AssetTransfer: Can only be called from this contract"
        );
        _;
    }

    function safelyTransferEther(address payable recipient, uint256 maxAmount)
        private
        returns (bool, uint256)
    {
        uint256 balance = address(this).balance;
        uint256 amount = LibUtils.min(maxAmount, balance);
        (bool success, ) = recipient.call{gas: ETHER_TRANSFER_GAS_LIMIT, value: amount}("");
        return (success, success ? amount : 0);
    }

    function safelyTransferERC20(address assetId, address recipient, uint256 maxAmount)
        private
        returns (bool, uint256)
    {
        (bool success, bytes memory encodedReturnValue) = address(this).call{gas: ERC20_BALANCE_GAS_LIMIT}(
            abi.encodeWithSignature("_getOwnERC20Balance(address)", assetId)
        );
        if (!success) { return (false, 0); }

        uint256 balance = abi.decode(encodedReturnValue, (uint256));
        uint256 amount = LibUtils.min(maxAmount, balance);
        (success, ) = address(this).call{gas: ERC20_TRANSFER_GAS_LIMIT}(
            abi.encodeWithSignature("_transferERC20(address,address,uint256)", assetId, recipient, amount)
        );
        return (success, success ? amount : 0);
    }

    function safelyTransfer(address assetId, address payable recipient, uint256 maxAmount)
        private
        returns (bool, uint256)
    {
        return LibAsset.isEther(assetId) ?
            safelyTransferEther(recipient, maxAmount) :
            safelyTransferERC20(assetId, recipient, maxAmount);

    }

    function _getOwnERC20Balance(address assetId)
        external
        onlySelf
        view
        returns (uint256)
    {
        return IERC20(assetId).balanceOf(address(this));
    }

    function _transferERC20(address assetId, address recipient, uint256 amount)
        external
        onlySelf
        returns (bool)
    {
        return LibAsset.transferERC20(assetId, recipient, amount);
    }

    function totalTransferred(address assetId) public view returns (uint256) {
        return _totalTransferred[assetId];
    }

    function registerTransfer(address assetId, uint256 amount) internal {
        _totalTransferred[assetId] += amount;
    }

    function transferAsset(address assetId, address payable recipient, uint256 maxAmount)
        internal
        returns (bool)
    {
        (bool success, uint256 amount) = safelyTransfer(assetId, recipient, maxAmount);

        if (success) {
            registerTransfer(assetId, amount);
        } else {
            addToEmergencyWithdrawableAmount(assetId, recipient, maxAmount);
            registerTransfer(assetId, maxAmount);
        }

        return success;
    }

}