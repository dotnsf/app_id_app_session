//. app.js

var express = require( 'express' ),
    crypto = require( 'crypto' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    passport = require( 'passport' ),
    redis = require( 'redis' ),
    request = require( 'request' ),
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
    path: '/'
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

//. #35
var access_token = null;
getAccessToken().then( function( token ){
  if( token ){
    access_token = token;
  }
}).catch( function( err ){
  console.log( err );
});

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

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

//. get user info
app.get( '/appid/user', async function( req, res ){
  //console.log( req.user );
  if( !req.user || !req.user.sub ){
    res.status( 401 );
    res.send( '' );
  }else{
    var profile = await getProfile( req.user.sub );
    //console.log( profile );
    if( profile && profile.profile ){
      res.json({
        user: {
          id: req.user.sub,
          name: req.user.name,
          email: req.user.email,
          attributes: profile.profile.attributes
        }
      });
    }else{
      res.status( 401 );
      res.send( '' );
    }
  }
});

app.all( '/*', function( req, res, next ){
  if( !req.user || !req.user.sub ){
    res.redirect( '/appid/login' );
  }else{
    next();
  }
});


app.get( '/', async function( req, res ){
  //console.log( req.user ); //. { name: 'FX', email: 'fx@teyan.de' }
  var profile = await getProfile( req.user.sub );
  //console.log( profile.profile ); //. { id: '28..', name: 'FX', email: 'fx@teyan.de' }
  res.render( 'index', { profile: profile.profile } );
});

function timestamp2datetime( ts ){
  if( ts ){
    var dt = new Date( ts );
    var yyyy = dt.getFullYear();
    var mm = dt.getMonth() + 1;
    var dd = dt.getDate();
    var hh = dt.getHours();
    var nn = dt.getMinutes();
    var ss = dt.getSeconds();
    var datetime = yyyy + '-' + ( mm < 10 ? '0' : '' ) + mm + '-' + ( dd < 10 ? '0' : '' ) + dd
      + ' ' + ( hh < 10 ? '0' : '' ) + hh + ':' + ( nn < 10 ? '0' : '' ) + nn + ':' + ( ss < 10 ? '0' : '' ) + ss;
    return datetime;
  }else{
    return "";
  }
}

async function getProfile( userId ){
  return new Promise( async ( resolve, reject ) => {
    if( access_token ){
      var headers1 = {
        accept: 'application/json',
        authorization: 'Bearer ' + access_token
      };
      var option1 = {
        url: 'https://' + settings_region + '.appid.cloud.ibm.com/management/v4/' + settings_tenantId + '/users/' + userId + '/profile',
        method: 'GET',
        headers: headers1
      };
      request( option1, ( err1, res1, body1 ) => {
        if( err1 ){
          console.log( 'err1', err1 );
          resolve( null );
        }else{
          var profile = JSON.parse( body1 );
          //console.log( JSON.stringify( profile, null, 2 ) );
          resolve( { status: true, profile: profile } );
        }
      });
    }else{
      resolve( null );
    }
  });
}

async function getAccessToken(){
  return new Promise( async ( resolve, reject ) => {
    //. GET an IAM token
    //. https://cloud.ibm.com/docs/appid?topic=appid-manging-api&locale=ja
    var headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    };
    var option = {
      url: 'https://iam.cloud.ibm.com/oidc/token',
      method: 'POST',
      body: 'grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=' + settings_apiKey,
      headers: headers
    };
    request( option, ( err, res, body ) => {
      if( err ){
        console.log( err );
        resolve( null );
      }else{
        body = JSON.parse( body );
        var access_token = body.access_token;
        resolve( access_token );
      }
    });
  });
}


//app.listen( appEnv.port );
var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

