<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Set Hong Kong timezone
date_default_timezone_set('Asia/Hong_Kong');

$data = json_decode(file_get_contents('php://input'), true);

// Use the actual first hit time without modification
$startTime = isset($data['startTime']) ? floatval($data['startTime']) : 0;

$entry = sprintf(
    "[%s] Score: %05d | Time: %05.2fs | First Hit: %05.3fs | Accuracy: %03d%%\n",
    date('Y-m-d H:i:s'),
    isset($data['score']) ? intval($data['score']) : 0,
    isset($data['realTime']) ? floatval($data['realTime']) : 0,
    $startTime,  // Use original first hit time
    isset($data['accuracy']) ? intval($data['accuracy']) : 0
);

file_put_contents('game_scores.txt', $entry, FILE_APPEND | LOCK_EX);
echo json_encode(['success' => true]);
?> 