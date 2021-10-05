const wppconnect = require('@wppconnect-team/wppconnect');
const firebasedb = require('./firebase')

var userStages = [];
var NotuserStages = [];
wppconnect.create({
    session: 'whatsbot',
    autoClose: false,
    puppeteerOptions: { args: ['--no-sandbox'] }
})
    .then((client) =>

        client.onMessage((message) => {

            console.log('Mensagem digitada pelo usuário: ' + message.body);
            var us = queryUserByPhone(client,message, JSON.stringify(message.from.replace(/[^\d]+/g, '')));
            console.log('Log User:' + JSON.stringify(message.from.replace(/[^\d]+/g, '')))
            client.sendText(message.from, 'TESTE! Teste bem sucedido:')
                .then((result) => {
                    console.log('Teste retornado: ', result.chatId.user);
                })
                .catch((erro) => {
                    console.error('ERRO: ', erro);
                });
        }))

    .catch((error) =>
        console.log(error));


async function queryUserByPhone(client, message, phone) {
    //let phone = (message.from).replace(/[^\d]+/g, '');
    let userdata = await firebasedb.queryByPhone(phone);
    if (userdata == null) {
        userdata = await saveUser(phone);
        stagesNotUser(client, message, userdata);
    }
    console.log('Usuário corrente: ' + userdata['id']);
    stages(client, message, userdata);
}

async function stagesNotUser(client, message, userdata) {
    if (NotuserStages[message.from] == undefined) {
        sendWppMessage(client, message.from, 'Não Cadastrado');
    }
}

async function stages(client, message, userdata) {
    if (userStages[message.from] == undefined) {
        sendWppMessage(client, message.from, 'Bem vindo ao Robô de Whatsapp do App de Sorteios!');
    }
    if (userdata['nome'] == undefined) {
        if (userStages[message.from] == undefined) {
            sendWppMessage(client, message.from, 'Digite seu *NOME*:');
            userStages[message.from] = 'nome';
        } else {
            userdata['nome'] = message.body;
            firebasedb.update(userdata);
            sendWppMessage(client, message.from, 'Obrigada, ' + message.body);
            sendWppMessage(client, message.from, 'Digite seu *CPF*:');
            userStages[message.from] = 'cpf';
        }

    } else if (userdata['cpf'] == undefined) {
        if (userStages[message.from] == undefined) {
            sendWppMessage(client, message.from, 'Digite seu *CPF*:');
            userStages[message.from] = 'cpf';
        } else {
                if(TestaCPF((message.body).replace(/[^\d]+/g, ''))){
                    userdata['cpf'] = (message.body).replace(/[^\d]+/g, '');
                    firebasedb.update(userdata);
                    sendWppMessage(client, message.from, 'Obrigada por informar seu CPF: ' + message.body);
                    sendWppMessage(client, message.from, 'Fim');
                    userStages[message.from] = 'fim';
                }else{
                    sendWppMessage(client, message.from, ' CPF Invalido: ' + message.body);
                    userStages[message.from] = 'cpf';
                    sendWppMessage(client, message.from, 'Digite seu *CPF*:');
                }
               
            
            
        }

    } else {
        if (userStages[message.from] == undefined) {
            userStages[message.from] = 'fim';
        }
        sendWppMessage(client, message.from, 'Fim');
    }
}

function sendWppMessage(client, sendTo, text) {
    client.sendText(sendTo, text)
        .then((result) => {
            // console.log('SUCESSO: ', result); 
        })
        .catch((erro) => {
            console.error('ERRO: ', erro);
        });
}

async function saveUser(phone) {
    let user = {
       // 'pushname': (message['sender']['pushname'] != undefined) ? message['sender']['pushname'] : '',
        'whatsapp': phone
    }
    let newUser = firebasedb.save(user);
    return newUser;
}

function TestaCPF(strCPF) {
    var Soma;
    var Resto;
    Soma = 0;
  if (strCPF == "00000000000") return false;

  for (i=1; i<=9; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (11 - i);
  Resto = (Soma * 10) % 11;

    if ((Resto == 10) || (Resto == 11))  Resto = 0;
    if (Resto != parseInt(strCPF.substring(9, 10)) ) return false;

  Soma = 0;
    for (i = 1; i <= 10; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (12 - i);
    Resto = (Soma * 10) % 11;

    if ((Resto == 10) || (Resto == 11))  Resto = 0;
    if (Resto != parseInt(strCPF.substring(10, 11) ) ) return false;
    return true;
}
