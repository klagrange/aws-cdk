import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as rds from '@aws-cdk/aws-rds';

export class SharedInfra extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;

  public readonly lb: elbv2.ApplicationLoadBalancer;
  public readonly lbListener: elbv2.ApplicationListener;

  public readonly portfolioBuilderEcr: ecr.Repository;
  public readonly shortTermGoalEcr: ecr.Repository;
  public readonly autoMlEcr: ecr.Repository;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    /**
     * VPC AND BASTION HOST
     */
    this.vpc = new ec2.Vpc(this, 'MyVpc', { maxAzs: 2 });
    const bastionSg = new ec2.SecurityGroup(this, 'BastionHostSg', {
      vpc: this.vpc,
      allowAllOutbound: true,
    });
    bastionSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    const bastionHost = new ec2.Instance(this, 'BastionHost', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      machineImage: new ec2.GenericLinuxImage({
        'ap-southeast-1': 'ami-09a4a9ce71ff3f20b', // Ubuntu Server 18.04 LTS (HVM), SSD Volume Type
        'ap-northeast-1': 'ami-07f4cb4629342979c', // Ubuntu Server 18.04 LTS (HVM), SSD Volume Type
      }),
      vpc: this.vpc,
      allowAllOutbound: true,
      keyName: 'moonshot-tokyo',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });
    bastionHost.addSecurityGroup(bastionSg);

    /**
     * ECS CLUSTER & ALB
     */
    this.cluster = new ecs.Cluster(this, 'Cluster', { vpc: this.vpc });
    this.lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc: this.vpc,
      internetFacing: true
    });
    const defaultTg = new elbv2.ApplicationTargetGroup(this, 'DefaultTg', {
      vpc: this.vpc,
      port: 80,
    });
    this.lbListener = this.lb.addListener('Listener', {
      port: 80,
      open: true,
      defaultTargetGroups: [defaultTg]
    });

    /**
     * ECR REPOSITORIES
     */
    this.portfolioBuilderEcr = new ecr.Repository(this, 'EcrRepoPortfolioBuilder', {
      repositoryName: 'portfolio-builder'
    })
    this.autoMlEcr = new ecr.Repository(this, 'EcrRepoAutoMl', {
      repositoryName: 'automl'
    })
    this.shortTermGoalEcr = new ecr.Repository(this, 'EcrRepoShortTermGoal', {
      repositoryName: 'short-term-goal'
    })

    /**
     * CFN OUTPUTS
     */
    // const bastionPublicDnsExportName = 'Moonshot-BastionHostPublicDns';
    // new cdk.CfnOutput(this, bastionPublicDnsExportName, {
    //   value: bastionHost.instancePublicDnsName,
    //   exportName: bastionPublicDnsExportName,
    // });
  }
}