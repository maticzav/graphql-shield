const {rule} = require('graphql-shield');

const isAuthenticated = rule()((parent, args, ctx) => {
	return Boolean(ctx.request.userId);
});

module.exports = {
	isAuthenticated
};
