import Alexa from 'alexa-sdk';
import now from 'performance-now';
import EchoHubAlexaSDK from 'echohub-alexa-sdk';

const echohub = new EchoHubAlexaSDK();

const handlePingRequest = async (alexa) => {
  const start = now();
  const response = await echohub.execute('ping');
  const end = now();
  const diff = (end - start).toFixed(3);

  if (response.errorType) {
    EchoHubAlexaSDK.handleError(alexa, response);
    return;
  }

  if (response.msg !== 'pong') {
    alexa.emit(':tell', 'Unexpected response, please contact EchoHub support');
    return;
  }

  alexa.emit(':tell', alexa.t('PONG', { milliseconds: diff }));
};

const handlers = {
  LaunchRequest() {
    this.emit(':tell', this.t('HELLO'));
  },

  PingIntent() {
    handlePingRequest(this);
  },

  Unhandled() {
    this.emit(':ask', this.t('NOT_UNDERSTOOD'));
  },
};

const languageStrings = {
  'en-US': {
    translation: {
      HELLO: 'Hi, welcome to EchoHub Debug. I can help debug any problems you might be having with EchoHub.',
      NOT_UNDERSTOOD: 'Sorry, I didn\'t get that',
      PONG: 'pong took {{milliseconds}} milliseconds.',
    },
  },
  'de-DK': {
    translation: {
      HELLO: 'Willkommen bei EchoHub Debug. Ich kann Ihnen helfen beim Debugging aller Probleme die Sie mit EchoHub haben.',
      NOT_UNDERSTOOD: 'Entschuldigung, das habe ich nicht verstanden',
      PONG: 'pong hat {{milliseconds}} milliseconds gebraucht.',
    },
  },
};

languageStrings['en-GB'] = { ...languageStrings['en-US'] };
languageStrings['en-IN'] = { ...languageStrings['en-US'] };
languageStrings['en-CA'] = { ...languageStrings['en-US'] };
languageStrings['en-AU'] = { ...languageStrings['en-US'] };

export default (event, context) => {
  console.error(event);

  const alexa = Alexa.handler(event, context);
  alexa.appId = process.env.ALEXA_SKILL_ID;
  alexa.resources = EchoHubAlexaSDK.languageStrings(languageStrings);

  echohub.handler(event, context);

  alexa.registerHandlers(handlers);
  alexa.execute();
};
