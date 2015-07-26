Package.describe({
  name: 'quietcreep:fuzzy',
  version: '0.1.0',
  summary: "Fuzzy text searching plugin for Meteor"
});

Package.on_use(function (api) {
  api.use( 'underscore' );

	api.addFiles( 'lib/fuzzy-search.js', [ 'client', 'server' ]);

	api.export( 'Fuzzy' );
});
