<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

// Handle CORS preflight options request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
$uploadsDir = __DIR__ . '/uploads';
$configPath = $uploadsDir . '/config.json';

// Create uploads directory if it doesn't exist
if (!file_exists($uploadsDir)) {
    mkdir($uploadsDir, 0777, true);
}

// Ensure config.json exists with default settings
if (!file_exists($configPath)) {
    $defaultConfig = [
        "categories" => [
            [
                "id" => "category_1",
                "name" => "পজিশন",
                "enabled" => true,
                "items" => []
            ],
            [
                "id" => "category_2",
                "name" => "সময়",
                "enabled" => true,
                "items" => [
                    ["id" => 101, "name" => "রাত ৮:৩০ টা", "description" => "ডিনার ডেটের সঠিক সময়"],
                    ["id" => 102, "name" => "বিকাল ৫:০০ টা", "description" => "ঘুরতে যাওয়ার সঠিক সময়"],
                    ["id" => 103, "name" => "সকাল ১০:০০ টা", "description" => "ব্রেকফাস্ট করার সময়"]
                ]
            ],
            [
                "id" => "category_3",
                "name" => "দিন",
                "enabled" => true,
                "items" => [
                    ["id" => 201, "name" => "শুক্রবার", "description" => "ছুটির দিন"],
                    ["id" => 202, "name" => "শনিবার", "description" => "ছুটির দিন"],
                    ["id" => 203, "name" => "রবিবার", "description" => "কাজের দিন শুরু"]
                ]
            ],
            [
                "id" => "category_4",
                "name" => "জায়গা",
                "enabled" => true,
                "items" => [
                    ["id" => 301, "name" => "রেস্টুরেন্ট", "description" => "সুন্দর রেস্টুরেন্টে ডিনার"],
                    ["id" => 302, "name" => "পার্ক", "description" => "বিকালে খোলা বাতাসে হাঁটা"],
                    ["id" => 303, "name" => "কফি শপ", "description" => "বসে আড্ডা দেওয়া"]
                ]
            ]
        ],
        "games" => []
    ];
    file_put_contents($configPath, json_encode($defaultConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Read raw POST request body
$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'save-config') {
    if (!$input) {
        echo json_encode(["error" => "No data provided"]);
        exit;
    }
    file_put_contents($configPath, json_encode($input, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(["success" => true]);
}

elseif ($action === 'upload') {
    try {
        $categoryId = $input['categoryId'] ?? '';
        $name = $input['name'] ?? '';
        $description = $input['description'] ?? '';
        $duration = isset($input['duration']) ? intval($input['duration']) : 0;

        if (!$dataUrl || !$categoryId) {
            throw new Exception("Missing parameters");
        }

        // Parse base64 Data URL
        if (preg_match('/^data:image\/(\w+);base64,(.+)$/', $dataUrl, $matches)) {
            $extension = $matches[1];
            if ($extension === 'jpeg') $extension = 'jpg';
            $base64Data = $matches[2];
            $buffer = base64_decode($base64Data);

            // Generate unique filename
            $cleanName = preg_replace('/[^a-zA-Z0-9]/', '_', strtolower($name));
            $filename = time() . '-' . $cleanName . '.' . $extension;
            $filepath = $uploadsDir . '/' . $filename;

            // Write image file
            file_put_contents($filepath, $buffer);

            $newImage = [
                "id" => time() . rand(100, 999),
                "name" => $name,
                "description" => $description,
                "duration" => $duration,
                "filename" => $filename,
                "url" => "./uploads/" . $filename
            ];

            // Update configuration database config.json
            $currentConfig = json_decode(file_get_contents($configPath), true);
            foreach ($currentConfig['categories'] as &$cat) {
                if ($cat['id'] === $categoryId) {
                    if (!isset($cat['items'])) $cat['items'] = [];
                    $cat['items'][] = $newImage;
                }
            }
            file_put_contents($configPath, json_encode($currentConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            echo json_encode(["success" => true, "image" => $newImage]);
        } else {
            throw new Exception("Invalid image data");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

elseif ($action === 'delete') {
    try {
        $categoryId = $input['categoryId'] ?? '';
        $id = $input['id'] ?? '';

        if (!$categoryId || !$id) {
            throw new Exception("Missing parameters");
        }

        $currentConfig = json_decode(file_get_contents($configPath), true);
        foreach ($currentConfig['categories'] as &$cat) {
            if ($cat['id'] === $categoryId) {
                $newItems = [];
                foreach ($cat['items'] as $item) {
                    $itemId = is_array($item) ? $item['id'] : $item;
                    if ($itemId == $id) {
                        // Delete associated file if exists
                        if (is_array($item) && isset($item['filename'])) {
                            $filepath = $uploadsDir . '/' . $item['filename'];
                            if (file_exists($filepath)) {
                                @unlink($filepath);
                            }
                        }
                    } else {
                        $newItems[] = $item;
                    }
                }
                $cat['items'] = $newItems;
            }
        }
        file_put_contents($configPath, json_encode($currentConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

elseif ($action === 'update') {
    try {
        $categoryId = $input['categoryId'] ?? '';
        $id = $input['id'] ?? '';
        $name = $input['name'] ?? '';
        $description = $input['description'] ?? '';
        $dataUrl = $input['dataUrl'] ?? '';

        if (!$categoryId || !$id) {
            throw new Exception("Missing parameters");
        }

        $currentConfig = json_decode(file_get_contents($configPath), true);
        $updatedItem = null;

        foreach ($currentConfig['categories'] as &$cat) {
            if ($cat['id'] === $categoryId) {
                foreach ($cat['items'] as &$item) {
                    if (is_array($item) && $item['id'] == $id) {
                        $filename = $item['filename'] ?? '';
                        $url = $item['url'] ?? '';

                        if ($dataUrl) {
                            // Delete old image if exists
                            if ($filename) {
                                $oldFilepath = $uploadsDir . '/' . $filename;
                                if (file_exists($oldFilepath)) {
                                    @unlink($oldFilepath);
                                }
                            }

                            // Write new image
                            if (preg_match('/^data:image\/(\w+);base64,(.+)$/', $dataUrl, $matches)) {
                                $extension = $matches[1];
                                if ($extension === 'jpeg') $extension = 'jpg';
                                $base64Data = $matches[2];
                                $buffer = base64_decode($base64Data);

                                $cleanName = preg_replace('/[^a-zA-Z0-9]/', '_', strtolower($name));
                                $filename = time() . '-' . $cleanName . '.' . $extension;
                                $filepath = $uploadsDir . '/' . $filename;

                                file_put_contents($filepath, $buffer);
                                $url = "./uploads/" . $filename;
                            }
                        }
                        $duration = isset($input['duration']) ? intval($input['duration']) : 0;
                        $item['name'] = $name;
                        $item['description'] = $description;
                        $item['duration'] = $duration;
                        $item['filename'] = $filename;
                        $item['url'] = $url;
                        $updatedItem = $item;
                    }
                }
            }
        }
        file_put_contents($configPath, json_encode($currentConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(["success" => true, "item" => $updatedItem]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

elseif ($action === 'clear') {
    try {
        // Clear all uploaded image files
        if (file_exists($uploadsDir)) {
            $files = glob($uploadsDir . '/*');
            foreach ($files as $file) {
                if (is_file($file) && basename($file) !== 'config.json') {
                    @unlink($file);
                }
            }
        }
        
        // Rewrite config.json with default empty states (same defaults as above)
        $defaultConfig = [
            "categories" => [
                ["id" => "category_1", "name" => "পজিশন", "enabled" => true, "items" => []],
                ["id" => "category_2", "name" => "সময়", "enabled" => true, "items" => [
                    ["id" => 101, "name" => "রাত ৮:৩০ টা", "description" => "ডিনার ডেটের সঠিক সময়"],
                    ["id" => 102, "name" => "বিকাল ৫:০০ টা", "description" => "ঘুরতে যাওয়ার সঠিক সময়"],
                    ["id" => 103, "name" => "সকাল ১০:০০ টা", "description" => "ব্রেকফাস্ট করার সময়"]
                ]],
                ["id" => "category_3", "name" => "দিন", "enabled" => true, "items" => [
                    ["id" => 201, "name" => "শুক্রবার", "description" => "ছুটির দিন"],
                    ["id" => 202, "name" => "শনিবার", "description" => "ছুটির দিন"],
                    ["id" => 203, "name" => "রবিবার", "description" => "কাজের দিন শুরু"]
                ]],
                ["id" => "category_4", "name" => "জায়গা", "enabled" => true, "items" => [
                    ["id" => 301, "name" => "রেস্টুরেন্ট", "description" => "সুন্দর রেস্টুরেন্টে ডিনার"],
                    ["id" => 302, "name" => "পার্ক", "description" => "বিকালে খোলা বাতাসে হাঁটা"],
                    ["id" => 303, "name" => "কফি শপ", "description" => "বসে আড্ডা দেওয়া"]
                ]]
            ],
            "games" => []
        ];
        file_put_contents($configPath, json_encode($defaultConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

else {
    http_response_code(404);
    echo json_encode(["error" => "Action not found"]);
}
