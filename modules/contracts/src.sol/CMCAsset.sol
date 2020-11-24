// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./interfaces/ICMCAsset.sol";
import "./interfaces/Types.sol";
import "./CMCCore.sol";
import "./lib/LibAsset.sol";
import "./lib/LibMath.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CMCAsset is CMCCore, ICMCAsset {
    using SafeMath for uint256;
    using LibMath for uint256;

    mapping(address => uint256) internal totalTransferred;
    mapping(address => mapping(address => uint256))
        private emergencyWithdrawableAmount;

    function registerTransfer(address assetId, uint256 amount) internal {
        totalTransferred[assetId] += amount;
    }

    function getTotalTransferred(address assetId)
        external
        view
        override
        onlyViaProxy
        nonReentrantView
        returns (uint256)
    {
        return totalTransferred[assetId];
    }

    function makeEmergencyWithdrawable(
        address assetId,
        address recipient,
        uint256 amount
    ) internal {
        emergencyWithdrawableAmount[assetId][
            recipient
        ] = emergencyWithdrawableAmount[assetId][recipient].satAdd(amount);
    }

    function makeBalanceEmergencyWithdrawable(
        address assetId,
        Balance memory balance
    ) internal {
        for (uint256 i = 0; i < 2; i++) {
            uint256 amount = balance.amount[i];
            if (amount > 0) {
                makeEmergencyWithdrawable(assetId, balance.to[i], amount);
            }
        }
    }

    function getEmergencyWithdrawableAmount(address assetId, address owner)
        external
        view
        override
        onlyViaProxy
        nonReentrantView
        returns (uint256)
    {
        return emergencyWithdrawableAmount[assetId][owner];
    }

    function getAvailableAmount(address assetId, uint256 maxAmount)
        internal
        view
        returns (uint256)
    {
        return Math.min(maxAmount, LibAsset.getOwnBalance(assetId));
    }

    function transferAsset(
        address assetId,
        address payable recipient,
        uint256 amount
    ) internal {
        registerTransfer(assetId, amount);
        require(
            LibAsset.unregisteredTransfer(assetId, recipient, amount),
            "CMCAsset: TRANSFER_FAILED"
        );
    }

    function emergencyWithdraw(
        address assetId,
        address owner,
        address payable recipient
    ) external override onlyViaProxy nonReentrant {
        require(
            msg.sender == owner || owner == recipient,
            "CMCAsset: OWNER_MISMATCH"
        );

        uint256 amount =
            getAvailableAmount(
                assetId,
                emergencyWithdrawableAmount[assetId][owner]
            );

        // Revert if amount is 0
        require(amount > 0, "CMCAsset: NO_OP");

        emergencyWithdrawableAmount[assetId][
            owner
        ] = emergencyWithdrawableAmount[assetId][owner].sub(amount);
        transferAsset(assetId, recipient, amount);
    }
}