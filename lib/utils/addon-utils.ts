import * as assert from "assert";
import { Construct } from "constructs";
import "reflect-metadata";
import { ClusterAddOn, ClusterInfo } from '../spi';
import * as semver from "semver";
import { logger } from "./log-utils";

/**
 * Returns AddOn Id if defined else returns the class name
 * @param addOn
 * @returns string
 */
export function getAddOnNameOrId(addOn: ClusterAddOn): string {
  return addOn.id ?? addOn.constructor.name;
}

export function isOrderedAddOn(addOn: ClusterAddOn) : boolean {
    return Reflect.getMetadata("ordered", addOn.constructor) ?? Reflect.getMetadata("ordered", addOn) ?? false;
}

/**
 * Decorator function that accepts a list of AddOns and
 * ensures addons are scheduled to be added as well as
 * add them as dependencies
 * @param addOns 
 * @returns 
 */
export function dependable(...addOns: string[]) {
  
  return function (target: any, key: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function( ...args: any[]) {
      const dependencies = Array<Promise<Construct>>();
      const clusterInfo: ClusterInfo = args[0];
      const stack = clusterInfo.cluster.stack.stackName;

      addOns.forEach( (addOn) => {
        if(clusterInfo.autoMode && isAutoModeAddon(addOn)) {
          return;
        }
        const dep = clusterInfo.getScheduledAddOn(addOn);
       
        let targetString = target?.constructor?.toString().split("\n")[0] ?? "unknown";

        assert(dep, `Missing a dependency for ${addOn} for ${stack} and target ${targetString}`);
        dependencies.push(dep!);
      });

      const result: Promise<Construct> = originalMethod.apply(this, args);

      Promise.all(dependencies.values()).then((constructs) => {
        constructs.forEach((construct) => {
            result.then((resource) => {
              resource.node.addDependency(construct);
            });
        });
      }).catch(err => { throw new Error(err); });

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator function that accepts a list of AddOns and
 * throws error if those addons are scheduled to be added as well
 * As they should not be deployed with
 * @param addOns 
 * @returns 
 */
export function conflictsWith(...addOns: string[]) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function( ...args: any[]) {
      // const dependencies: (Promise<Construct> | undefined)[] = [];
      const clusterInfo: ClusterInfo = args[0];
      const stack = clusterInfo.cluster.stack.stackName;

      addOns.forEach( (addOn) => {
        const dep = clusterInfo.getScheduledAddOn(addOn);
        if (dep){
          throw new Error(`Deploying ${stack} failed due to conflicting add-on: ${addOn}.`);
        }
      });

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

function compareAddonEksVersions(version1: string, version2: string): number {
  // Extract semver and build number from both versions
  const [semver1, build1] = parseEksVersion(version1);
  const [semver2, build2] = parseEksVersion(version2);

  // Compare semver parts first
  const semverCompare = semver.compare(semver1, semver2);
  if (semverCompare !== 0) return semverCompare;

  // If semver parts are equal, compare build numbers
  return build1 - build2;
}

    // Helper function to parse EKS version
function parseEksVersion(version: string): [string, number] {
  const match = version.match(/^v?(\d+\.\d+\.\d+)(?:-eksbuild\.(\d+))?$/);
  if (!match) {
    throw new Error(`Invalid EKS version format: ${version}`);
  }
  return [match[1], parseInt(match[2] || '0', 10)];
}


export function conflictsWithAutoMode(minExpectedVersion?: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function(this: any, ...args: any[]) {
      const clusterInfo: ClusterInfo = args[0];
      const stack = clusterInfo.cluster.stack.stackName;
      const addonName = this.constructor.name;
      if (!clusterInfo.autoMode) {
        return originalMethod.apply(this, args);
      }
      let version = null;
      if('getAddonVersion' in this && typeof this.getAddonVersion === 'function'){
        version = this.getAddonVersion();
      }
      if (minExpectedVersion == "fail") {
        throw new Error(`Deploying ${stack} failed. Add-on ${addonName} is already available on the cluster with EKS Auto Mode.`);
      }
      else if (minExpectedVersion == null || version ==  "auto") {
        logger.warn(`Add-on ${addonName} is already available on the cluster with EKS Auto Mode. Please check https://docs.aws.amazon.com/eks/latest/userguide/auto-enable-existing.html#auto-addons-required to ensure that the specified version is compatible`);
        return originalMethod.apply(this, args);
      }
      else if (compareAddonEksVersions(version, minExpectedVersion) >= 0){ // what to do if other nodegroups attached too?
        return originalMethod.apply(this, args);
      } else {
        throw new Error(`Deploying ${stack} failed. Add-on ${addonName} is already available on the cluster with EKS Auto Mode.  If you would like to install this addon alongside automode, please upgrade to version ${minExpectedVersion}`);
      }
    };

        return descriptor;
  };
}

/**
 * Checks if the passed addon is part of auto mode and deployed by the EKS CP. 
 * @param addOn addOn name to check
 * @returns true if it is one of the addOns that is managed by the EKS in Auto Mode
 */
function isAutoModeAddon(addOn: string) : boolean {
  const automodeAddons = [
    "EbsCsiDriverAddOn",
    "AwsLoadBalancerControllerAddOn",
    "VpcCniAddOn",
    "CoreDnsAddOn",
    "KubeProxyAddOn",
  ];
  return automodeAddons.includes(addOn);
}

