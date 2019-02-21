const {rule} = require('graphql-shield');

const isAuthenticated = rule()((parent, args, ctx) => {
	return ctx.request.userId !== null;
});

module.exports = {
	isAuthenticated
};
