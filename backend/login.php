<?php
// Incluimos el archivo de conexión a la base de datos.
require 'db_connection.php';

// Leemos los datos JSON enviados desde la aplicación React.
$data = json_decode(file_get_contents("php://input"));

// Verificamos que hemos recibido los datos esperados.
if (isset($data->login) && isset($data->password)) {
    $login = $data->login;
    $password = $data->password;

    // Preparamos la consulta para evitar inyecciones SQL.
    $stmt = $conn->prepare("SELECT * FROM usuarios WHERE login = ?");
    $stmt->bind_param("s", $login); // "s" significa que la variable es un string.
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // El usuario existe, ahora verificamos la contraseña.
        $user = $result->fetch_assoc();
        
        // password_verify() compara la contraseña enviada con el hash guardado en la BD.
        if (password_verify($password, $user['password'])) {
            // La contraseña es correcta.
            
            // No enviamos la contraseña hasheada de vuelta al cliente.
            unset($user['password']);

            // Enviamos una respuesta de éxito con los datos del usuario.
            echo json_encode([
                "success" => true,
                "user" => $user
            ]);
        } else {
            // La contraseña es incorrecta.
            echo json_encode([
                "success" => false,
                "message" => "Credenciales inválidas."
            ]);
        }
    } else {
        // El usuario no existe.
        echo json_encode([
            "success" => false,
            "message" => "Credenciales inválidas."
        ]);
    }

    $stmt->close();
} else {
    // No se recibieron los datos necesarios.
    echo json_encode([
        "success" => false,
        "message" => "Datos incompletos."
    ]);
}

$conn->close();
?>
