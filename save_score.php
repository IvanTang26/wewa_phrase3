<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

// Validate and sanitize data
$score = isset($data['score']) ? intval($data['score']) : 0;
$realTime = isset($data['realTime']) ? floatval($data['realTime']) : 0;
$startTime = isset($data['startTime']) ? floatval($data['startTime']) : 0;
$accuracy = isset($data['accuracy']) ? intval($data['accuracy']) : 0;

// Create formatted string
$entry = sprintf(
    "[%s] Score: %05d | Time: %05.2fs | First Hit: %05.3fs | Accuracy: %03d%%\n",
    date('Y-m-d H:i:s'),
    $score,
    $realTime,
    $startTime,
    $accuracy
);

// Save to text file
file_put_contents('game_scores.txt', $entry, FILE_APPEND | LOCK_EX);

echo json_encode(['success' => true]);
?> 