// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.8;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import 'hardhat/console.sol';
import { Router } from "@hyperlane-xyz/core/contracts/Router.sol";
import { TypeCasts } from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import { SwapMessage } from "./util/SwapMessage.sol";

contract ERC20MultichainAtomicSwapReceiver is Router {
  using TypeCasts for bytes32;
  using TypeCasts for address;
  using SwapMessage for bytes;

  event HTLCERC20WithdrawalInitiated(bytes32 indexed htlcId);
  event HTLCERC20WithdrawalCompleted(bytes32 indexed htlcId);
  event HTLCERC20Refunded(bytes32 indexed htlcId);

  struct HTLCContract {
    address receiver;
    address receiverToken;
    uint256 receiverAmount;

    address sender;
    uint32 senderDomain;

    uint256 timelock;
    bool confirmed;
    bool refunded;
  }

  mapping(bytes32 => HTLCContract) htlcs;
  uint32 receiverDomain;

  modifier tokensTransferable(
    address _token,
    address _sender,
    uint256 _amount
  ) {
    require(_amount > 0, 'tokensTransferable: token amount must be > 0');
    require(
      ERC20(_token).allowance(_sender, address(this)) >= _amount,
      'tokensTransferable: token allowance must be >= amount'
    );
    _;
  }

  modifier htlcExists(bytes32 _htlcId) {
    require(haveHTLC(_htlcId), 'htlcExists: htlcId does not exist');
    _;
  }

  function initialize(
    address _connectionManager,
    address _interchainGasPaymaster,
    uint32 _receiverDomain
  ) external initializer {
      // transfers ownership to `msg.sender`
      __AbacusConnectionClient_initialize(
          _connectionManager,
          _interchainGasPaymaster
      );
      receiverDomain = _receiverDomain;
  }

  function startWithdrawal(
    uint256 _timelock,
    address _sender,
    uint32 _senderDomain,
    address _senderToken,
    uint256 _senderAmount,
    address _receiverToken,
    uint256 _receiverAmount
  )
    external
    tokensTransferable(_receiverToken, msg.sender, _receiverAmount)
    payable
    returns (bytes32 htlcId)
  {
    htlcId = _getHtlcId(
      _getSenderHash(_sender, _senderDomain, _senderToken, _senderAmount),
      _getReceiverHash(receiverDomain, _receiverToken, _receiverAmount),
      _timelock
    );

    if (haveHTLC(htlcId)) revert('startWithdrawal: Withdrawal already started');

    if (!ERC20(_receiverToken).transferFrom(msg.sender, address(this), _receiverAmount)) {
      revert('withdraw: transferFrom sender to this failed');
    }
    
    htlcs[htlcId] = HTLCContract(
      msg.sender,
      _receiverToken,
      _receiverAmount,
      _sender,
      _senderDomain,
      _timelock,
      false,
      false
    );

    _dispatchWithGas(
      _senderDomain,
      SwapMessage.format(htlcId, msg.sender.addressToBytes32()),
      msg.value
    );

    emit HTLCERC20WithdrawalInitiated(htlcId);
  }

  function _finishWithdrawal(bytes32 _htlcId)
    internal
    htlcExists(_htlcId)
    returns (bool)
  {
    HTLCContract storage c = htlcs[_htlcId];
    require(c.confirmed == false, 'finishWithdrawal: already withdrawn');
    require(c.refunded == false, 'finishWithdrawal: already refunded');

    ERC20(c.receiverToken).transfer(c.sender, c.receiverAmount);
    c.confirmed = true;

    emit HTLCERC20WithdrawalCompleted(_htlcId);
    return true;
  }

  function refund(bytes32 _htlcId)
    external
    htlcExists(_htlcId)
    returns (bool)
  {
    HTLCContract storage c = htlcs[_htlcId];

    require(c.confirmed == false, 'refundable: already withdrawn');
    require(c.refunded == false, 'refundable: already refunded');
    
    require(c.timelock <= block.timestamp, 'refundable: timelock not yet passed');

    c.refunded = true;
    ERC20(c.receiverToken).transfer(c.receiver, c.receiverAmount);
    emit HTLCERC20Refunded(_htlcId);
    return true;
  }

  function getHTLC(bytes32 _htlcId)
    public
    view
    returns (
      bool confirmed,
      bool refunded,
      address receiver
    )
  {
    if (haveHTLC(_htlcId) == false) return (false, false, address(0));
    
    HTLCContract storage c = htlcs[_htlcId];
    return (
      c.confirmed,
      c.refunded,
      c.sender
    );
  }

  function haveHTLC(bytes32 _htlcId) internal view returns (bool exists) {
    exists = (htlcs[_htlcId].sender != address(0));
  }

  function getDomain() public view returns (uint32 _receiverDomain) {
    _receiverDomain = receiverDomain;
  }

  function _handle(
    uint32,
    bytes32,
    bytes calldata _message
  ) internal override {
    bytes32 htlcId = _message.htlcId();
    if (!haveHTLC(htlcId)) revert('_handle: HTLC not found');

    _finishWithdrawal(htlcId);
  }

  function _getSenderHash(
    address _sender,
    uint32 _senderDomain,
    address _senderToken,
    uint256 _senderAmount
  ) internal pure returns (bytes32 hash) {
    hash = keccak256(abi.encodePacked(_sender, _senderDomain, _senderToken, _senderAmount));
  }

  function _getReceiverHash(
    uint32 _receiverDomain,
    address _receiverToken,
    uint256 _receiverAmount
  ) internal pure returns (bytes32 hash) {
    hash = keccak256(abi.encodePacked(_receiverDomain, _receiverToken, _receiverAmount));
  }

  function _getHtlcId(
    bytes32 _senderHash,
    bytes32 _receiverHash,
    uint256 _timelock
  ) internal pure returns (bytes32 hash) {
    hash = keccak256(abi.encodePacked(_senderHash, _receiverHash, _timelock));
  }
}
