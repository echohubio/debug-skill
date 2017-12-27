import Alexa from 'alexa-sdk';
import now from 'performance-now';

import EchoHubApi from './echohubapi';

const echohub = new EchoHubApi();

const handlePingRequest = async (alexa) => {
  const start = now();
  const response = await echohub.execute('ping');
  const end = now();
  const diff = (end - start).toFixed(3);

  if (response.errorType) {
    EchoHubApi.handleError(alexa, response);
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
};

export default (event, context) => {
  console.error(event);

  const alexa = Alexa.handler(event, context);
  alexa.appId = process.env.ALEXA_SKILL_ID;
  alexa.resources = EchoHubApi.languageStrings(languageStrings);

  echohub.handler(event, context);

  alexa.registerHandlers(handlers);
  alexa.execute();
};
