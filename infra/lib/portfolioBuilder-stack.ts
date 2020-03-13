import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as rds from '@aws-cdk/aws-rds';


export interface SplitAtListener_ServiceStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  cluster: ecs.ICluster;
  lb: elbv2.ApplicationLoadBalancer;
  portfolioBuilderEcr: ecr.Repository;
  lbListener: elbv2.ApplicationListener;
}

export class PortfolioBuilderStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: SplitAtListener_ServiceStackProps) {
      super(scope, id, props);
      /**
       * RDS instance [portfolio-builder]
       */
      // new rds.DatabaseInstance(this, 'DataFeedRds', {
      //   databaseName: 'datafeed',
      //   masterUsername: 'master',
      //   engine: rds.DatabaseInstanceEngine.POSTGRES,
      //   vpc: this.vpc,
      //   vpcPlacement: { 
      //     subnetType: ec2.SubnetType.PRIVATE,
      //   },
      //   instanceClass: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MEDIUM),
      // })

      // create a target group and attach it to our moonshot load balancer
      const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
        vpc: props.vpc,
        port: 80,
      });
      new elbv2.ApplicationListenerRule(this, 'rule', {
        listener: props.lbListener,
        priority: 1,
        targetGroups: [targetGroup],
        pathPattern: '/portfolio-builder*'
      });

      // create a service based a task definition
      const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef');
      const container = taskDefinition.addContainer('portfolio-builder', {
        image: ecs.ContainerImage.fromEcrRepository(props.portfolioBuilderEcr, 'latest'),
        memoryLimitMiB: 512,
      });
      container.addPortMappings({
        containerPort: 80,
        protocol: ecs.Protocol.TCP
      });

      const service = new ecs.FargateService(this, "Service", {
        cluster: props.cluster,
        taskDefinition,
      });
      
      // point target group to service
      targetGroup.addTarget(service);
  }
}