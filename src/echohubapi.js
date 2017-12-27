import phetch from 'phetch';
import PromiseChainTimeoutRejection from 'promise-chain-timeout-rejection';
import merge from 'deepmerge';

class EchoHubApi {
  handler(event, context) {
    this.event = context;
    this.context = context;
    this.accessToken = event && event.session && event.session.user && event.session.user.accessToken;

    if (!this.accessToken) {
      this.error = {
        errorType: 'no_auth',
      };
    }
  }

  execute(command, ...args) {
    if (this.error) {
      return this.error;
    }

    const payload = {
      command,
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

  static languageStrings(theirStrings) {
    const myStrings = {
      'en-GB': {
        translation: {
          SAY_HELLO_MESSAGE: 'Hello World!',
        },
      },
      'en-US': {
        translation: {
          ECHOHUB_NO_DATA: 'No data, please contact EchoHub support.',
          ECHOHUB_NO_ERROR: 'No error, please contact EchoHub support',
          ECHOHUB_API_TIMEOUT: 'EchoHub API timed out, please contact EchoHub support',
          ECHOHUB_NO_AUTH: 'I couldn\'t authenticate you. Have you linked your skill to EchoHub?',
          ECHOHUB_NO_HUBBER: 'You need to link your local hubber to EchoHub before I can help you.',
          ECHOHUB_HUBBER_TIMEOUT: 'I can\'t contact your hubber, is it running?',
          ECHOHUB_PLUGIN_MISSING: 'You need to install the plugin for this skill on the EchoHub website.',
          ECHOHUB_UNKNOWN_ERROR: 'Unknown error, please contact EchoHub support',
        },
      },
      'de-DE': {
        translation: {
          SAY_HELLO_MESSAGE: 'Hallo Welt!',
        },
      },
    };

    return merge(myStrings, theirStrings || {});
  }

  static handleError(alexa, error) {
    if (!error) {
      alexa.emit(':tell', alexa.t('ECHOHUB_NO_DATA'));
      return;
    }

    if (!error.errorType) {
      alexa.emit(':tell', alexa.t('ECHOHUB_NO_ERROR'));
      return;
    }

    switch (error.errorType) {
      case 'api_timeout':
        alexa.emit(':tell', alexa.t('ECHOHUB_API_TIMEOUT'));
        break;
      case 'no_auth':
        alexa.emit(':tell', alexa.t('ECHOHUB_NO_AUTH'));
        break;
      case 'no_hubber':
        alexa.emit(':tell', alexa.t('ECHOHUB_NO_HUBBER'));
        break;
      case 'hubber_timeout':
        alexa.emit(':tell', alexa.t('ECHOHUB_HUBBER_TIMEOUT'));
        break;
      case 'plugin_missing':
        alexa.emit(':tell', alexa.t('ECHOHUB_PLUGIN_MISSING'));
        break;
      case 'unknown':
      default:
        console.error('UNKNOWN ERROR');
        console.error(error);
        alexa.emit(':tell', alexa.t('ECHOHUB_UNKNOWN_ERROR'));
        break;
    }
  }
}

export default EchoHubApi;
