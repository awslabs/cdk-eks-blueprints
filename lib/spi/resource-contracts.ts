import { IResource, RemovalPolicy, ResourceEnvironment, Stack } from 'aws-cdk-lib';
import { ResourceContext } from './types';
import { IConstruct, Node } from 'constructs';

/** 
 * Generic resource provider interface. 
 **/
export declare interface ResourceProvider<T extends IConstruct = IConstruct> {
  provide(context: ResourceContext): T;
}

/**
 * Class for returning multiple objects from a Resource provider
 * example: VPC as primaryResource and Secondary Subnets as subResources
 */
export class MultiConstruct<T extends IResource, R extends IConstruct> implements IResource {
  readonly stack: Stack;
  readonly env: ResourceEnvironment;
  readonly node: Node;
  primaryResource: T;
  subResources?: R[];

  constructor(primaryResource: T, subResources?: R[]) {
    this.primaryResource = primaryResource;
    this.subResources = subResources;
    this.stack = primaryResource.stack;
    this.env = primaryResource.env;
    this.node = primaryResource.node;
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }

        const primaryValue = Reflect.get(target.primaryResource, prop);

        if (typeof primaryValue == 'function') {
          return primaryValue.bind(target.primaryResource);
        }
        return primaryValue;
      }

    })
  }

  applyRemovalPolicy(policy: RemovalPolicy): void {
    this.primaryResource.applyRemovalPolicy(policy)
  }
}
