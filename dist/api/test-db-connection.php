<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

$host = $input['host'] ?? '';
$port = $input['port'] ?? 3306;
$database = $input['database'] ?? '';
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';
$ssl = $input['ssl'] ?? 'preferred';

if (empty($host) || empty($database) || empty($username)) {
    echo json_encode(['success' => false, 'error' => 'Missing required database parameters']);
    exit;
}

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
    
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    // Add SSL options if needed
    if ($ssl === 'required') {
        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
    }

    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Test the connection with a simple query
    $stmt = $pdo->query('SELECT 1 as test');
    $result = $stmt->fetch();
    
    if ($result && $result['test'] == 1) {
        echo json_encode([
            'success' => true, 
            'message' => 'Database connection successful',
            'server_info' => $pdo->getAttribute(PDO::ATTR_SERVER_INFO)
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Connection test failed']);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false, 
        'error' => 'Connection failed: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'error' => 'Unexpected error: ' . $e->getMessage()
    ]);
}
?>