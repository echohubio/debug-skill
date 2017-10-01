import Alexa from 'alexa-sdk';
import phetch from 'phetch';
import now from 'performance-now';

let accessToken;

const send = (payload) => {
  const request = phetch.post('https://api.echohub.io/iot/thing/send')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', accessToken)
    .json(payload)
    .then(res => res.json())
    .catch((err) => {
      console.error('DERROR');
      console.error(accessToken);
      console.error(err);
    });

  return request;
};

const handlePingRequest = async (alexa) => {
  console.error(alexa);

  const payload = {
    command: 'ping',
  };

  const start = now();
  const data = await send(payload);
  const end = now();
  const diff = (start - end).toFixed(3);

  console.error(data);

  if (!data) {
    alexa.emit(':tell', 'I\'m sorry, I had a problem communicating with EchoHub.');
    return;
  }

  if (data.errorCode) {
    switch (data.errorCode) {
      case 'no_hubber':
        alexa.emit(':tell', 'You need to link your hubber to EchoHub before I can help you.');
        break;
      default:
        console.error(data);
        alexa.emit(':tell', 'Unknown error, please contact EchoHub support');
        break;
    }

    return;
  }

  if (data.msg !== 'pong') {
    alexa.emit(':tell', 'Unknown error, please contact EchoHub support');
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
  accessToken = event.session.user.accessToken;

  const alexa = Alexa.handler(event, context);
  alexa.appId = process.env.ALEXA_SKILL_ID;

  if (!accessToken) {
    alexa.emit(':tell', 'There seems to be a problem, please relink your EchoHub account');
    return;
  }

  alexa.registerHandlers(handlers);
  alexa.execute();
};
