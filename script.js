const webhookUrl = 'https://astroimob.bitrix24.com.br/rest/1/r79kbtr1thccso0j/';

function loadLeadData(leadId) {
    fetch(`${webhookUrl}crm.lead.get?id=${leadId}`)
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                console.error(result.error);
                document.getElementById('lead-info').innerHTML = '<p>Erro ao carregar lead</p>';
            } else {
                const lead = result.result;
                const phone = lead.PHONE ? lead.PHONE[0].VALUE : '';
                const name = lead.NAME || 'Cliente';

                document.getElementById('lead-info').innerHTML = `<p><strong>Nome:</strong> ${name}</p><p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>`;

                if (phone) {
                    const whatsappLink = `https://wa.me/55${phone.replace(/\D/g, '')}`;
                    document.getElementById('whatsapp-action').innerHTML = `<a href="${whatsappLink}"  class="whatsapp-btn">Enviar WhatsApp</a>`;
                } else {
                    document.getElementById('whatsapp-action').innerHTML = '<p style="color: red;">Lead sem telefone cadastrado</p>';
                }
            }
        });
}

// Inicializa o app quando o Bitrix24 carregar
BX24.init(function() {
    console.log('App WhatsApp iniciado!');
    loadLeadData();
});

// Carrega os dados do lead
function loadLeadData() {
    // Pega o ID do lead atual
    const leadId = BX24.placement.info().options.ID;
    
    // Busca os dados do lead
    BX24.callMethod(
        'crm.lead.get',
        { id: leadId },
        function(result) {
            if (result.error()) {
                console.error('Erro ao carregar lead:', result.error());
                return;
            }
            
            const lead = result.data();
            
            // Preenche o nome
            const name = lead.NAME || lead.TITLE || 'Sem nome';
            document.getElementById('name').value = name;
            
            // Preenche o telefone
            const phone = getPhoneNumber(lead);
            document.getElementById('phone').value = phone;
            
            // Cria mensagem padrão
            const defaultMessage = `Olá ${name}! Vi que você demonstrou interesse em nossos produtos/serviços. Como posso ajudar?`;
            document.getElementById('message').value = defaultMessage;
        }
    );
}

// Extrai o número de telefone do lead
function getPhoneNumber(lead) {
    if (lead.PHONE && lead.PHONE.length > 0) {
        // Pega o primeiro telefone disponível
        return lead.PHONE[0].VALUE;
    }
    return '';
}

// Abre o WhatsApp com a mensagem
function openWhatsApp() {
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;
    
    if (!phone) {
        alert('❌ Telefone não encontrado! Por favor, adicione um telefone ao lead.');
        return;
    }
    
    if (!message.trim()) {
        alert('❌ Por favor, digite uma mensagem!');
        return;
    }
    
    // Remove caracteres especiais do telefone
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Adiciona 55 se não tiver código do país
    const whatsappPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
    
    // Cria o link do WhatsApp
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
    
    // Abre em nova aba
    window.open(whatsappUrl, '_blank');
    
    // Registra no histórico do Bitrix24 (opcional)
    addToHistory(message);
}

// Adiciona comentário no histórico do lead
function addToHistory(message) {
    const leadId = BX24.placement.info().options.ID;
    
    BX24.callMethod(
        'crm.timeline.comment.add',
        {
            fields: {
                ENTITY_ID: leadId,
                ENTITY_TYPE: "lead",
                COMMENT: `📱 WhatsApp enviado: ${message}`
            }
        },
        function(result) {
            if (result.error()) {
                console.error('Erro ao adicionar ao histórico:', result.error());
            } else {
                console.log('Mensagem registrada no histórico!');
            }
        }
    );
}

// Ajusta altura do iframe automaticamente
function resizeFrame() {
    const height = document.body.scrollHeight;
    BX24.resizeWindow(400, height);
}

// Redimensiona quando o conteúdo mudar
window.addEventListener('load', resizeFrame);
document.getElementById('message').addEventListener('input', resizeFrame);
