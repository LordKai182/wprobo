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
            var us = queryUserByPhone(client, message, JSON.stringify(message.from.replace(/[^\d]+/g, '')));
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
        //userdata = await saveUser(phone);
        stagesNotUser(client, message, phone);
    } else {
        console.log('Usuário corrente: ' + userdata['id']);
        stages(client, message, userdata);
    }

}

async function stagesNotUser(client, message, phone) {
    if (NotuserStages[message.from] == undefined) {
        sendWppMessage(client, message.from, 'Bem vindo ao Robô de Whatsapp do App de Sorteios!');
        sendWppMessage(client, message.from, 'observei que você não esta cadastrado, aqui estão as opções.');
        sendWppMessage(client, message.from, '1 - CADASTRAR');
        sendWppMessage(client, message.from, '2 - SAIR');
        sendWppMessage(client, message.from, '3 - SOBRE O SORTEIO');
        sendWppMessage(client, message.from, '4 - COMO ESTA ?');
        sendWppMessage(client, message.from, '5 - TYPPING');
        sendWppMessage(client, message.from, '6 - IMAGE');
        NotuserStages[message.from] = 'opcao';
    } else {
        switch (message.body) {
            case "1":
                sendWppMessage(client, message.from, 'Selecionado - CADASTRAR');
                userdata = await saveUser(phone);
                stages(client, message, userdata);
                break;
            case "QUERO ME CADASTRAR":
                sendWppMessage(client, message.from, 'Selecionado - QUERO ME CADASTRAR');
                userdata = await saveUser(phone);
                stages(client, message, userdata);
                break;
            case "2":
                sendWppMessage(client, message.from, 'Obrigado por entrar em contato, aguardo você em breve.');
                NotuserStages[message.from] = undefined;
                break;
            case "SAIR":
                sendWppMessage(client, message.from, 'Obrigado por entrar em contato, aguardo você em breve.');
                NotuserStages[message.from] = undefined;
                break;
            case "3":
                sendWppMessage(client, message.from, 'Selecionado - SOBRE O SORTEIO');
                await client.sendMessageOptions(message.from, sobre(), {
                    title: 'Sobre o Sorteio',
                    footer: 'Escolha uma opção abaixo',
                    isDynamicReplyButtonsMsg: true,
                    dynamicReplyButtons: [
                        {
                            buttonId: 'idSim',
                            buttonText: {
                                displayText: 'QUERO ME CADASTRAR',
                            },
                            type: 1,
                        },
                        {
                            buttonId: 'idNao',
                            buttonText: {
                                displayText: 'SAIR',
                            },
                            type: 1,
                        },
                    ],
                });
                break;
            case "4":
                let info = await client.getHostDevice();
                let messa = `_*Connection info*_\n\n`;
                messa += `*User name:* ${info.pushname}\n`;
                messa += `*Number:* ${info.wid.user}\n`;
                messa += `*Battery:* ${info.battery}\n`;
                messa += `*Plugged:* ${info.plugged}\n`;
                messa += `*Device Manufacturer:* ${info.phone.device_manufacturer}\n`;
                messa += `*WhatsApp version:* ${info.phone.wa_version}\n`;
                client.sendText(message.from, messa);
                break
            case "5":
                const option = message.body.split(' ')[1];
                if (option == 'true') {
                    // Start typing...
                    await client.startTyping(message.from);
                } else {
                    // Stop typing
                    await client.stopTyping(message.from);
                }
                break

            case "6":
                await client
                    .sendImage(
                        message.from,
                        './src/qrcodee.png',
                        'image-name',
                        'Escaneie este QR-Code com seu APP favorito e compre um bilhete, Custo R$: 3,00'
                    )
                    .then((result) => {
                        console.log('Result: ', result); //return object success
                    })
                    .catch((erro) => {
                        console.error('Error when sending: ', erro); //return object error
                    });
                break
            default:
                sendWppMessage(client, message.from, 'Opção não encontrada, as opções são:');
                sendWppMessage(client, message.from, '1 - CADASTRAR');
                sendWppMessage(client, message.from, '2 - SAIR');
                sendWppMessage(client, message.from, '3 - SOBRE O SORTEIO');
                sendWppMessage(client, message.from, '4 - COMO ESTA ?');
                sendWppMessage(client, message.from, '5 - TYPPING');
                sendWppMessage(client, message.from, '6 - IMAGE');
                break;
        }
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
            if (TestaCPF((message.body).replace(/[^\d]+/g, ''))) {
                userdata['cpf'] = (message.body).replace(/[^\d]+/g, '');
                userdata['bilhetes'] = []
                firebasedb.update(userdata);
                sendWppMessage(client, message.from, 'Obrigada por informar seu CPF: ' + message.body);
                sendWppMessage(client, message.from, 'Fim');
                userStages[message.from] = 'fim';
            } else {
                sendWppMessage(client, message.from, ' CPF Invalido: ' + message.body);
                userStages[message.from] = 'cpf';
                sendWppMessage(client, message.from, 'Digite seu *CPF*:');
            }



        }

    } else {
        if (userStages[message.from] == undefined) {
            userStages[message.from] = 'fim';
        }
        switch (message.body) {
            case "MODO-DEUS":
                sendWppMessage(client, message.from, 'Olá ' + userdata['nome'] + ' Bem Vindo ao Modo DEUS.');
                await client.sendMessageOptions(message.from, 'Escolha o que deseja Fazer.', {
                    title: 'Menu MODO-DEUS',
                    footer: 'Escolha uma opção abaixo',
                    isDynamicReplyButtonsMsg: true,
                    dynamicReplyButtons: [
                        {
                            buttonId: 'idComprarB',
                            buttonText: {
                                displayText: 'INICIAR SORTEIO',
                            },
                            type: 1,
                        },
                        {
                            buttonId: 'idMeusB',
                            buttonText: {
                                displayText: 'FINALIZAR SORTEIO',
                            },
                            type: 1,
                        },
                        {
                            buttonId: 'idSair',
                            buttonText: {
                                displayText: 'SAIR',
                            },
                            type: 1,
                        },

                    ],
                });
                break
            case "INICIAR SORTEIO":
                sendWppMessage(client, message.from, 'voce escolheu INICIAR SORTEIO');
                break
            case "FINALIZAR SORTEIO":
                sendWppMessage(client, message.from, 'voce escolheu FINALIZAR SORTEIO');
                break
            case "COMPRAR BILHETES":
                sendWppMessage(client, message.from, 'voce escolheu COMPRAR BILHETES');
                let bilhe = '123487'
                sendWppMessage(client, message.from, 'Voce Comprou o Bilhete Nº:' + bilhe);
                userdata['bilhetes'].push(bilhe)
                sendWppMessage(client, message.from, 'Não esqueça que quanto mais bilhete você tiver mais as chances de ganhar!! Boa sorte.');
                firebasedb.update(userdata);

                break;
            case "MEUS BILHETES":
                sendWppMessage(client, message.from, 'voce escolheu MEUS BILHETES');
                let bilhetes = userdata['bilhetes']
                sendWppMessage(client, message.from, 'Seus Bilhetes são:');
                count = 1
                bilhetes.map(b => {
                    sendWppMessage(client, message.from, count + " - " + b);
                    count++
                })
                break;
            case "SAIR":
                sendWppMessage(client, message.from, 'Obrigado por entrar em contato, aguardo você em breve.');
                NotuserStages[message.from] = undefined;
                userStages[message.from] = undefined;
                break;
            default:
                sendWppMessage(client, message.from, 'Olá ' + userdata['nome'] + ' Bom te ver por aqui.');
                await client.sendMessageOptions(message.from, 'isso aqui é um teste', {
                    title: 'Comprar um bilhete ?',
                    footer: 'Escolha uma opção abaixo',
                    isDynamicReplyButtonsMsg: true,
                    dynamicReplyButtons: [
                        {
                            buttonId: 'idComprarB',
                            buttonText: {
                                displayText: 'COMPRAR BILHETES',
                            },
                            type: 1,
                        },
                        {
                            buttonId: 'idMeusB',
                            buttonText: {
                                displayText: 'MEUS BILHETES',
                            },
                            type: 1,
                        },
                        {
                            buttonId: 'idSair',
                            buttonText: {
                                displayText: 'SAIR',
                            },
                            type: 1,
                        },

                    ],
                });
                break;
        }

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

    for (i = 1; i <= 9; i++) Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
    Resto = (Soma * 10) % 11;

    if ((Resto == 10) || (Resto == 11)) Resto = 0;
    if (Resto != parseInt(strCPF.substring(9, 10))) return false;

    Soma = 0;
    for (i = 1; i <= 10; i++) Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
    Resto = (Soma * 10) % 11;

    if ((Resto == 10) || (Resto == 11)) Resto = 0;
    if (Resto != parseInt(strCPF.substring(10, 11))) return false;
    return true;
}

function sobre() {
    let texto = ''
    texto += 'Vc já se imaginou em um sistema onde vc consome o que normalmente já consumiria e a partir de cada valor "x", vc ainda ganha vouchers para ser abençoado com um valor em pix, referente a arrecadação até o momento do sorteio.'
    texto += 'Pense como uma troca de favores e uma união de forças que no final alguém será agraciado a cada sorteio.'
    texto += 'E esse agraciado pode ser vc!!!'
    texto += 'E aí? '
    texto += 'Está pronto para usufruir desta benção?'
    texto += 'Vc também pode comprar vouchers individuais.'
    texto += 'Podendo gastar no próprio estabelecimento, em outros ou até mesmo em bilhetes.'

    return texto
}
