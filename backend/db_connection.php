<?php

$servername = "localhost";
$username = "root";      // Usuario por defecto de Ampps
$password = "root";    // Contraseña por defecto de Ampps
$dbname = "clinica_sic";


// --- CABECERAS PARA PERMITIR SOLICITUDES (CORS) ---
// Esto es crucial para que tu aplicación React (desde otro dominio/puerto) pueda comunicarse con este backend.
header("Access-Control-Allow-Origin: *"); // Permite solicitudes desde cualquier origen. Para producción, es mejor restringirlo a tu dominio.
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// --- CREAR LA CONEXIÓN ---
$conn = new mysqli($servername, $username, $password, $dbname);

// --- VERIFICAR LA CONEXIÓN ---
if ($conn->connect_error) {
    // Si la conexión falla, detenemos la ejecución y mostramos un error.
    // Es importante usar die() para que el script no continúe si no hay base de datos.
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Opcional: Establecer el conjunto de caracteres a UTF-8 para manejar acentos y caracteres especiales correctamente.
$conn->set_charset("utf8");

// No cerramos la conexión aquí. Este archivo será incluido en otros que la necesitarán activa.
// La conexión se cerrará automáticamente cuando el script termine.
?>