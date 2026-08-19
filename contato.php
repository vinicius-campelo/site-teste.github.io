<?php
/**
 * contato.php — Alto Nível Construtora e Serviços Gerais
 * Recebe o formulário de contato do site e envia por e-mail.
 *
 * IMPORTANTE: este script usa a função mail() do PHP, que depende de um
 * servidor de e-mail configurado na hospedagem (comum em hospedagens
 * compartilhadas cPanel). Se sua hospedagem não suportar mail(), troque o
 * envio abaixo por PHPMailer/SMTP (Gmail, SendGrid, etc.) — instrução ao final.
 */

header('Content-Type: application/json; charset=utf-8');

// E-mail que vai RECEBER os pedidos de orçamento. Troque pelo e-mail real da empresa.
$destinatario = 'contato@altonivelconstrutora.com.br';

// Só aceita requisições POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

function limpar($valor) {
    return htmlspecialchars(trim($valor ?? ''), ENT_QUOTES, 'UTF-8');
}

$nome     = limpar($_POST['nome'] ?? '');
$telefone = limpar($_POST['telefone'] ?? '');
$email    = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$servico  = limpar($_POST['servico'] ?? '');
$mensagem = limpar($_POST['mensagem'] ?? '');

// Validação básica no servidor (nunca confie só na validação do navegador)
$erros = [];
if (strlen($nome) < 3)      $erros[] = 'Nome inválido.';
if (strlen($telefone) < 8)  $erros[] = 'Telefone inválido.';
if (!$email)                $erros[] = 'E-mail inválido.';
if (strlen($servico) < 2)   $erros[] = 'Serviço não informado.';

if (!empty($erros)) {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => implode(' ', $erros)]);
    exit;
}

$assunto = "Novo pedido de orçamento — Alto Nível ($servico)";

$corpo = "Novo contato recebido pelo site Alto Nível\n\n";
$corpo .= "Nome: $nome\n";
$corpo .= "Telefone/WhatsApp: $telefone\n";
$corpo .= "E-mail: $email\n";
$corpo .= "Serviço de interesse: $servico\n";
$corpo .= "Mensagem:\n$mensagem\n\n";
$corpo .= "Enviado em: " . date('d/m/Y H:i:s') . "\n";

$headers   = [];
$headers[] = "From: site.altonivel@" . ($_SERVER['SERVER_NAME'] ?? 'localhost');
$headers[] = "Reply-To: $email";
$headers[] = "Content-Type: text/plain; charset=UTF-8";

$enviado = @mail($destinatario, $assunto, $corpo, implode("\r\n", $headers));

if ($enviado) {
    http_response_code(200);
    echo json_encode(['sucesso' => true, 'mensagem' => 'Mensagem enviada com sucesso.']);
} else {
    http_response_code(500);
    echo json_encode([
        'sucesso'  => false,
        'mensagem' => 'Não foi possível enviar o e-mail no servidor. Verifique a configuração de mail() da hospedagem.'
    ]);
}

/**
 * Alternativa recomendada caso mail() não funcione na sua hospedagem:
 * usar PHPMailer com SMTP autenticado (Gmail, Outlook, SendGrid, etc.).
 * Exemplo (requer "composer require phpmailer/phpmailer"):
 *
 * use PHPMailer\PHPMailer\PHPMailer;
 * require 'vendor/autoload.php';
 * $mail = new PHPMailer(true);
 * $mail->isSMTP();
 * $mail->Host       = 'smtp.seudominio.com.br';
 * $mail->SMTPAuth   = true;
 * $mail->Username   = 'contato@altonivelconstrutora.com.br';
 * $mail->Password   = 'SENHA_AQUI';
 * $mail->SMTPSecure = 'tls';
 * $mail->Port       = 587;
 * $mail->setFrom('contato@altonivelconstrutora.com.br', 'Site Alto Nível');
 * $mail->addAddress($destinatario);
 * $mail->Subject = $assunto;
 * $mail->Body    = $corpo;
 * $mail->send();
 */
