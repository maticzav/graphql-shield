:wave:

Thank you for reading this file! We'd love to see you help us make this package even better than it is. Since we are all working on GraphQLShield in our free time, it's important that we follow some set of guidelines to make communication easier. Read this guideline to learn what we have in mind.

### Language & Community

Generally, people are very smart. I am smart, you are smart, everyone here is smart. As a rule of thumb, try to understand what the other person is saying even if it doesn't make any sense. It's highly probable that they _just_ don't know how to explain their (actually) very good idea.

### Openning Issues

Check the docs first, check discussions second, sleep on your problem. If it still seems like a bug open an issue. It's a lot more beneficial if you find a workaround and share it than opening up an issue and complaining about it.

And you'll feel great, I promise.

### Requesting Features

Alright, so you want a new feature, right? Me too! Everyone wants a new feature - a little something that would solve their small (or big) problem. Unfortunatelly, literally _everyone_ wants a feature.

This is a community driven project. Nobody is paid to work on it. Keep that in mind at all times.

To save people working on GraphQLShield some time, first check other issues and discussions to see if somebody has requested a similar feature. It's a lot easier for us to prioritise tasks and implement a feature if we see a flourishing discussion in one of the feature requests. Share your thoughts, do research.

We are inclined to read well structured arguments. If your request hasn't received much attention in say a month, try to do some research on it and share your findings. The more knowledge there already is, the easier (and faster) your feature will be implemented.

### Pull Request

When submitting a pull request, it's important that you correctly label your change. Does it fix something? Does it introduce something new? Breaks something?

We use semantic versioning. You can read more about it [here](https://semver.org). Additionally we use [changesets](https://github.com/atlassian/changesets) to automate releases. Learn that too.

Don't feel discouraged by _all the things you have to learn_. **You can do it.** This is a slowly evolving library, we want to get it right.

When you've finished a PR and everyone agrees that it should be merged, run `pnpm changeset` and fill out the form. Push the changes and wait for your contribution to be published.

Thank you! You made this library a lot better than it was. :heart:

### Adding examples

Oh cool! We love examples. Create a folder in `examples` that contains your example, and name it `<name>-example`. Check out existing examples for more guidance!

Make sure your example passes our tests. You can check that by running `pnpm test:examples`.

### Development Environment Setup

You'll need `pnpm`. Run `pnpm install` to install everything.
