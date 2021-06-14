//. app.js

var express = require( 'express' ),
    ejs = require( 'ejs' ),
    passport = require( 'passport' ),
    redis = require( 'redis' ),
    session = require( 'express-session' ),
    WebAppStrategy = require( 'ibmcloud-appid' ).WebAppStrategy,
    app = express();

var settings = require( './settings' );

//. env values
var settings_redis_server = 'REDIS_SERVER' in process.env ? process.env.REDIS_SERVER : settings.redis_server;
var settings_redis_port = 'REDIS_PORT' in process.env ? process.env.REDIS_PORT : settings.redis_port;
var settings_region = 'REGION' in process.env ? process.env.REGION : settings.region;
var settings_tenantId = 'TENANT_ID' in process.env ? process.env.TENANT_ID : settings.tenantId;
var settings_apiKey = 'APIKEY' in process.env ? process.env.APIKEY : settings.apiKey;
var settings_secret = 'SECRET' in process.env ? process.env.SECRET : settings.secret;
var settings_clientId = 'CLIENT_ID' in process.env ? process.env.CLIENT_ID : settings.clientId;
var settings_redirectUri = 'REDIRECT_URI' in process.env ? process.env.REDIRECT_URI : settings.redirectUri;
var settings_oauthServerUrl = 'https://' + settings_region + '.appid.cloud.ibm.com/oauth/v4/' + settings_tenantId;

//. setup redis
var RedisStore = require( 'connect-redis' )( session );
var redisClient = redis.createClient({
  host: settings_redis_server,
  port: settings_redis_port
});

//. setup session
app.use( session({
  secret: 'app_id_app_session',
  resave: false,
  store: new RedisStore({
    client: redisClient
  }),
  cookie: {
    path: '/',
    maxAge: ( 365 * 24 * 60 * 60 * 1000 )
  },
  saveUninitialized: false
}));

//. setup passport
app.use( passport.initialize() );
app.use( passport.session() );
passport.serializeUser( ( user, cb ) => cb( null, user ) );
passport.deserializeUser( ( user, cb ) => cb( null, user ) );
passport.use( new WebAppStrategy({
  tenantId: settings_tenantId,
  clientId: settings_clientId,
  secret: settings_secret,
  oauthServerUrl: settings_oauthServerUrl,
  redirectUri: settings_redirectUri
}));

//. enable routing
app.use( express.Router() );

//. template engine
app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

//. login
app.get( '/appid/login', passport.authenticate( WebAppStrategy.STRATEGY_NAME, {
  successRedirect: '/',
  forceLogin: false //true
}));

//. callback
app.get( '/appid/callback', function( req, res, next ){
  next();
}, passport.authenticate( WebAppStrategy.STRATEGY_NAME )
);

//. logout
app.get( '/appid/logout', function( req, res ){
  WebAppStrategy.logout( req );
  res.redirect( '/' );
});

//. access restriction
app.all( '/*', function( req, res, next ){
  if( !req.user || !req.user.sub ){
    res.redirect( '/appid/login' );
  }else{
    next();
  }
});


//. top page
app.get( '/', function( req, res ){
  res.render( 'index', { profile: req.user } );
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

