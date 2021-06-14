import Head from 'next/head'
import { FeatureList, HeroGradient, HeroIllustration, InfoList } from '@theguild/components'
import { handlePushRoute } from '@guild-docs/client'

export default function Index() {
  return (
    <>
      <Head>
        <title>GraphQL Shield</title>
      </Head>
      <HeroGradient
        title="GraphQL permissions as another layer of abstraction."
        description="Implement your server permissions in a clear and deterministic way."
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
        colors={['#FF34AE', '#1CC8EE']}
        // image={{
        //   src: '/assets/home-claw.png',
        //   alt: 'Illustration',
        // }}
      />
      <FeatureList
        title="What's GraphQL Shield?"
        items={[
          {
            image: {
              alt: 'Pluggable',
              src: '/assets/features-pluggable.png',
            },
            title: 'Pluggable',
            description: 'Powerful plugin system that wraps the entire GraphQL execution pipeline.',
          },
          {
            image: {
              alt: 'Flexible',
              src: '/assets/features-modern.png',
            },
            title: 'Flexible',
            description: 'Use with any HTTP server, and any GraphQL schema libraries (code-first / schema-first).',
          },
          {
            image: {
              alt: 'Develop Faster',
              src: '/assets/features-performant.png',
            },
            title: 'Develop Faster',
            description: `You don't have to reinvent the wheel for every feature. You can write/use Envelop plugin for most workflows.`,
          },
        ]}
      />

      <HeroIllustration
        title="How it works?"
        description="GraphQL Shield wrapps your schema resolvers and inteligently manages access to fields."
        image={{
          src: '/assets/home-communication.png',
          alt: 'Illustration',
        }}
        flipped
      />

      <InfoList
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
      />
    </>
  )
}
