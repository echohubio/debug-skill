import Alexa from 'alexa-sdk';
import phetch from 'phetch';
import now from 'performance-now';
import PromiseChainTimeoutRejection from 'promise-chain-timeout-rejection';

class EchoHubApi {
  handler(event, context) {
    this.event = context;
    this.context = context;
    this.accessToken = event && event.session && event.session.user && event.session.user.accessToken;

    if (!this.accessToken) {
      return {
        errorType: 'no_auth',
      };
    }

    return {};
  }

  execute(command, ...args) {
    const payload = {
      command: 'ping',
      args,
    };

    const request = phetch.put(`${process.env.ECHOHUB_API_URL}/iot/thing`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', this.accessToken)
      .json(payload)
      .then(res => res.json())
      .catch(err => ({ errorType: 'phetch', errorMsg: err }));

    const promiseTimeout = new PromiseChainTimeoutRejection(this.context.getRemainingTimeInMillis() - 500);

    return promiseTimeout.globalTimeoutRejection(() => request)
      .catch((err) => {
        const errorType = err instanceof PromiseChainTimeoutRejection.PromiseTimeOutError ? 'api_timeout' : 'unknown';

        return {
          errorType,
          errorMsg: err,
        };
      });
  }

  static handleError(alexa, error) {
    if (!error) {
      alexa.emit(':tell', 'No data, please contact EchoHub support.');
      return;
    }

    if (!error.errorType) {
      alexa.emit(':tell', 'No error, please contact EchoHub support');
      return;
    }

    switch (error.errorType) {
      case 'api_timeout':
        alexa.emit(':tell', 'EchoHub API timed out, please contact EchoHub support');
        break;
      case 'no_auth':
        alexa.emit(':tell', 'I couldn\'t authenticate you. Have you linked your skill to EchoHub?');
        break;
      case 'no_hubber':
        alexa.emit(':tell', 'You need to link your local hubber to EchoHub before I can help you.');
        break;
      case 'hubber_timeout':
        alexa.emit(':tell', 'I can\'t contact your hubber, is it running?');
        break;
      case 'unknown':
      default:
        console.error('UNKNOWN ERROR');
        console.error(error);
        alexa.emit(':tell', 'Unknown error, please contact EchoHub support');
        break;
    }
  }
}

const echohub = new EchoHubApi();

const handlePingRequest = async (alexa) => {
  const start = now();
  const response = await echohub.execute('ping');
  const end = now();
  const diff = (start - end).toFixed(3);

  if (response.errorType) {
    EchoHubApi.handleError(alexa, response);
    return;
  }

  if (response.msg !== 'pong') {
    alexa.emit(':tell', 'Unexpected response, please contact EchoHub support');
    return;
  }


  alexa.emit(':tell', `pong took at ${diff} milliseconds.`);
};

const handlers = {
  LaunchRequest() {
    const speechOutput = 'Hi, welcome to EchoHub Debug. I can help debug any problems you might be hacing with EchoHub.';

    this.emit(':tell', speechOutput);
  },

  PingIntent() {
    handlePingRequest(this);
  },

  Unhandled() {
    this.emit(':ask', 'Sorry, I didn\'t get that', 'Try saying a number.');
  },
};

export default (event, context) => {
  console.error(event);

  const alexa = Alexa.handler(event, context);
  alexa.appId = process.env.ALEXA_SKILL_ID;

  const result = echohub.handler(event, context);

  if (result.errorType) {
    EchoHubApi.handleError(alexa, result);
    return;
  }

  alexa.registerHandlers(handlers);
  alexa.execute();
};
