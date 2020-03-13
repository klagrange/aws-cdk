#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { SharedInfra } from '../lib/sharedInfra-stack';
import { PortfolioBuilderStack } from '../lib/portfolioBuilder-stack';
import { AutoMlStack } from '../lib/autoMl-stack';
import { ShortTermGoalsStack } from '../lib/shortTermGoals-stack';

const app = new cdk.App();

const sharedInfra = new SharedInfra(app, 'MoonshotSharedInfra', {
    env: {
        region: 'ap-northeast-1'
    }
});
// ap-northeast-1
// ap-southeast-1

new PortfolioBuilderStack(app, 'MoonshotPortfolioBuilder', {
    cluster: sharedInfra.cluster,
    vpc: sharedInfra.vpc,
    lb: sharedInfra.lb,
    portfolioBuilderEcr: sharedInfra.portfolioBuilderEcr,
    lbListener: sharedInfra.lbListener,
    env: {
        region: 'ap-northeast-1'
    }
})

new AutoMlStack(app, 'MoonshotAutoMl', {
    cluster: sharedInfra.cluster,
    vpc: sharedInfra.vpc,
    lb: sharedInfra.lb,
    autoMlEcr: sharedInfra.autoMlEcr,
    lbListener: sharedInfra.lbListener,
    env: {
        region: 'ap-northeast-1'
    }
})

new ShortTermGoalsStack(app, 'MoonshotShortTermGoals', {
    cluster: sharedInfra.cluster,
    vpc: sharedInfra.vpc,
    lb: sharedInfra.lb,
    shortTermGoalEcr: sharedInfra.shortTermGoalEcr,
    lbListener: sharedInfra.lbListener,
    env: {
        region: 'ap-northeast-1'
    }
})