// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.8;

library SwapMessage {
    function format(bytes32 _htlcId, bytes32 _recipient)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodePacked(_htlcId, _recipient);
    }

    function htlcId(bytes calldata message) internal pure returns (bytes32) {
        return bytes32(message[0:32]);
    }

    function recipient(bytes calldata message) internal pure returns (bytes32) {
        return bytes32(message[32:64]);
    }
}