-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 04 Jul 2021 pada 09.53
-- Versi server: 10.4.6-MariaDB
-- Versi PHP: 7.2.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `proyek_soa`
--
CREATE DATABASE IF NOT EXISTS `proyek_soa` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `proyek_soa`;

-- --------------------------------------------------------

--
-- Struktur dari tabel `client`
--

DROP TABLE IF EXISTS `client`;
CREATE TABLE `client` (
  `email` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `tanggal_lahir` date NOT NULL,
  `no_telp` int(15) NOT NULL,
  `saldo` int(10) NOT NULL,
  `role` varchar(20) NOT NULL COMMENT 'dokter/client/receptionist'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data untuk tabel `client`
--

INSERT INTO `client` (`email`, `username`, `name`, `password`, `tanggal_lahir`, `no_telp`, `saldo`, `role`) VALUES
('abc@d.com', 'bca', 'bca', '$2a$10$KC.qyauUwQkWj1oDF78rPebSknDN3/TJeGafUYtjs3bztn6aX3/DK', '1990-10-10', 1990122, 0, 'dokter'),
('client@g.com', 'FirstClient', 'Nick', '$2a$10$mxxfs7Fz2jVW6MvZr.MJL.C8Fv1lXEJEhkm4Jg.DaN3kDUWZlqmq6', '2000-10-09', 998812, 5000, 'client'),
('r@g.com', 'tion', 'tion', '$2a$10$xa4AS4d.Q66bbaHXXi4ASua5T/b6pqtGuTL33MeMR9SSM6RHbZ2b.', '1999-11-09', 22222, 0, 'receptionist');

-- --------------------------------------------------------

--
-- Struktur dari tabel `developer`
--

DROP TABLE IF EXISTS `developer`;
CREATE TABLE `developer` (
  `email` varchar(100) NOT NULL,
  `username` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data untuk tabel `developer`
--

INSERT INTO `developer` (`email`, `username`, `name`, `password`) VALUES
('appgeeks@gmail.com', 'appnerds', 'Edwin Lo', '$2a$10$IaBQ5TqXKcKiDv9amQUbJ.vplitUGcgNaRpvcL91rt1yUaMPMwYJ2');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `client`
--
ALTER TABLE `client`
  ADD PRIMARY KEY (`email`);

--
-- Indeks untuk tabel `developer`
--
ALTER TABLE `developer`
  ADD PRIMARY KEY (`email`),
  ADD UNIQUE KEY `username` (`username`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
