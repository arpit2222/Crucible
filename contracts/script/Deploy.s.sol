pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {Crucible} from "../src/Crucible.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        Crucible c = new Crucible();
        vm.stopBroadcast();
    }
}
