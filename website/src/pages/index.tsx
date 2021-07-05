import Head from 'next/head'
import { FeatureList, HeroGradient, HeroIllustration, InfoList } from '@theguild/components'
import { handlePushRoute } from '@guild-docs/client'

export default function Index() {
  return (
    <>
      <Head>
        <title>GraphQL Shield</title>
      </Head>

      <div style={{ paddingTop: '50px' }} />

      <HeroGradient
        title="GraphQL Permissions Framework For Complex Authorisation Systems"
        description="Implement your server permissions in a clear and deterministic way and let it guard access to your schema."
        link={{
          href: '/docs',
          children: 'Get Started',
          title: 'Learn more about GraphQL Shield',
          onClick: (e) => handlePushRoute('/docs', e),
        }}
        // version={
        //   <a href="https://www.npmjs.com/package/@envelop/core" target="_blank">
        //     <img src="https://badge.fury.io/js/%40envelop%2Fcore.svg" alt="npm version" height="18" />
        //   </a>
        // }
        colors={['#56C4FF', '#6B9CFF']}
        image={{
          src: '/assets/framework.png',
          alt: 'Illustration',
        }}
      />

      {/* Features */}

      <HeroIllustration
        title="Create a handful of rules and reuse them across your schema"
        description={`Shield lets you create a handful of rules and compose them into meaningful structures using logical operators.`}
        image={{
          src: '/assets/composable.png',
          alt: 'Composable',
        }}
      />

      <HeroIllustration
        title="Every rule is intelligently cached to prevent duplicated validation"
        description={`To prevent recalculation of rules, every rule caches its result based on selected caching mechanism and speeds up query execution.`}
        image={{
          src: '/assets/fast.png',
          alt: 'Shield is Fast',
        }}
        flipped
      />

      <HeroIllustration
        title="Be confident that your rule is used at the right place"
        description={`Shield generates a type-map from your schema to make sure you have assigned your rules to the right places.`}
        image={{
          src: '/assets/safe.png',
          alt: 'Illustration',
        }}
      />

      <div style={{ paddingBottom: '100px' }} />

      {/* Info */}

      {/* <InfoList
        title="Learn More"
        items={[
          {
            title: 'The envelop approach',
            description: 'Learn more about Envelop core and how it works',
            link: {
              href: '/docs',
              children: 'Documentation',
              title: 'Read the documentation',
              onClick: (e) => handlePushRoute('/docs', e),
            },
          },
          {
            title: 'Integrations',
            description: 'Integrate GraphQL Shield with your existing setup quickly.',
            link: {
              href: '/docs/integrations',
              children: 'Integrations & Examples',
              title: 'Search examples',
              onClick: (e) => handlePushRoute('/docs/integrations', e),
            },
          },
        ]}
      /> */}
    </>
  )
}
