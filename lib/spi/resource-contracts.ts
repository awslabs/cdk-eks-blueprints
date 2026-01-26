import { IResource, RemovalPolicy, ResourceEnvironment, Stack } from 'aws-cdk-lib';
import { ResourceContext } from './types';
import { IConstruct, Node } from 'constructs';

/** 
 * Generic resource provider interface. 
 **/
export declare interface ResourceProvider<T extends IConstruct = IConstruct> {
    provide(context: ResourceContext): T;
}

export class MultiConstruct<T extends IConstruct, R extends IConstruct> implements IResource{

  constructor(primaryResource: T, subResources?: R[]) {
    this.primaryResource = primaryResource
    this.subResources = subResources
  }
  stack: Stack;
  env: ResourceEnvironment;
  applyRemovalPolicy(policy: RemovalPolicy): void {
      throw new Error('Method not implemented.');
  }
  node: Node;
  primaryResource: T
  subResources?: R[]
}
