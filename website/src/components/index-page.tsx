import { ReactElement } from 'react'
import { HeroGradient, HeroIllustration, IHeroIllustrationProps } from '@theguild/components'

import Framework from 'public/assets/framework.png'
import Composable from 'public/assets/composable.png'
import Fast from 'public/assets/fast.png'
import Safe from 'public/assets/safe.png'

export const ITEMS: IHeroIllustrationProps[] = [
  {
    title: 'Create a Handful of Rules and Reuse Them across Your Schema',
    description: 'Shield lets you create a handful of rules and compose them into meaningful structures using logical operators.',
    image: {
      src: Composable,
      alt: 'Composable',
    },
  },
  {
    title: 'Every Rule Is Intelligently Cached to Prevent Duplicated Validation',
    description:
      'To prevent recalculation of rules, every rule caches its result based on selected caching mechanism and speeds up query execution.',
    image: {
      src: Fast,
      alt: 'Fast',
    },
    flipped: true,
  },
  {
    title: 'Be Confident That Your Rule Is Used at the Right Place',
    description: 'Shield generates a type-map from your schema to make sure you have assigned your rules to the right places.',
    image: {
      src: Safe,
      alt: 'Safe',
    },
  },
]

export function IndexPage(): ReactElement {
  return (
    <>
      <HeroGradient
        title="GraphQL Permissions Framework for Complex Authorisation Systems"
        description="Implement your server permissions in a clear and deterministic way and let it guard access to your schema."
        link={{
          href: '/docs',
          children: 'Get Started',
          title: 'Learn more about GraphQL Shield',
        }}
        colors={['#56c4ff', '#6b9cff']}
        image={{
          src: Framework,
          alt: 'Illustration',
        }}
      />
      {ITEMS.map((option) => (
        <HeroIllustration
          key={option.title as string}
          {...option}
          image={{
            ...option.image,
            className: 'h-52 md:h-72',
          }}
        />
      ))}
    </>
  )
}
