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

$config = $input['config'] ?? null;
$sql = $input['sql'] ?? '';
$params = $input['params'] ?? [];

if (!$config || empty($sql)) {
    echo json_encode(['success' => false, 'error' => 'Missing required parameters']);
    exit;
}

$host = $config['host'] ?? '';
$port = $config['port'] ?? 3306;
$database = $config['database'] ?? '';
$username = $config['username'] ?? '';
$password = $config['password'] ?? '';
$ssl = $config['ssl'] ?? 'preferred';

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
        PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
    ];

    // Add SSL options if needed
    if ($ssl === 'required') {
        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
    }

    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Handle multi-statement SQL (for table creation)
    if (strpos($sql, ';') !== false && count(explode(';', $sql)) > 2) {
        // Multi-statement execution
        $pdo->exec($sql);
        $data = [];
        $affectedRows = 0;
    } else {
        // Single statement execution
        if (empty($params)) {
            $stmt = $pdo->query($sql);
            $data = $stmt->fetchAll();
            $affectedRows = $stmt->rowCount();
        } else {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll();
            $affectedRows = $stmt->rowCount();
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $data,
        'affectedRows' => $affectedRows
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Query failed: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Unexpected error: ' . $e->getMessage()
    ]);
}
?>