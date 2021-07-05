-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 05 Jul 2021 pada 08.50
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
-- Struktur dari tabel `consul`
--

DROP TABLE IF EXISTS `consul`;
CREATE TABLE IF NOT EXISTS `consul` (
  `id_consul` int(50) NOT NULL AUTO_INCREMENT,
  `email_user` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `doctor_name` varchar(255) NOT NULL,
  `info` varchar(255) NOT NULL,
  PRIMARY KEY (`id_consul`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

--
-- Dumping data untuk tabel `consul`
--

INSERT INTO `consul` (`id_consul`, `email_user`, `name`, `doctor_name`, `info`) VALUES
(1, 'yoyo@g.com', 'yoyo', 'temi', 'Check up bulanan'),
(2, 'yoyo@g.com', 'yoyo', 'teddy', 'Suntik Vaksin');

-- --------------------------------------------------------

--
-- Struktur dari tabel `developer_account`
--

DROP TABLE IF EXISTS `developer_account`;
CREATE TABLE IF NOT EXISTS `developer_account` (
  `email` varchar(100) NOT NULL,
  `username` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `profile_photo` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `api_key` varchar(255) NOT NULL,
  `api_hit` int(11) NOT NULL,
  `account_type` enum('free','premium') NOT NULL,
  PRIMARY KEY (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data untuk tabel `developer_account`
--

INSERT INTO `developer_account` (`email`, `username`, `name`, `profile_photo`, `password`, `api_key`, `api_hit`, `account_type`) VALUES
('appgeeks@gmail.com', 'appnerds', 'Edwin Lo', NULL, '$2a$10$15m3pAyJiYoOMLuiThk7LOVW/FA2Ai3nFnZnpwkiSUN6Tf/EiyUMi', 'nereKWQz_CIOv/ScoDx+0WzfaGuPyiN6', 100, 'free'),
('devgeeks123@gmail.com', 'appgeeks', 'Edwin Lo 1', NULL, '$2a$10$Z.XAS3lZDkCWFpUCFPppNeWI5if3xSBvAC.Rn5vs5t2KB21mRt/3q', 'ga0xXhvks7n8iFlCDu7q34rQuc1OwAKm', 100, 'free');

-- --------------------------------------------------------

--
-- Struktur dari tabel `user_account`
--

DROP TABLE IF EXISTS `user_account`;
CREATE TABLE IF NOT EXISTS `user_account` (
  `email` varchar(100) NOT NULL,
  `username` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `tanggal_lahir` date NOT NULL,
  `no_telp` varchar(15) NOT NULL,
  `saldo` int(10) NOT NULL,
  `role` enum('client','dokter','receptionist') NOT NULL COMMENT 'dokter/client/receptionist',
  `api_hit` int(5) NOT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data untuk tabel `user_account`
--

INSERT INTO `user_account` (`email`, `username`, `name`, `password`, `tanggal_lahir`, `no_telp`, `saldo`, `role`, `api_hit`) VALUES
('abc@d.com', 'bca', 'bca', '$2a$10$KC.qyauUwQkWj1oDF78rPebSknDN3/TJeGafUYtjs3bztn6aX3/DK', '1990-10-10', '1990122', 0, 'dokter', 0),
('client@g.com', 'FirstClient', 'Nick', '$2a$10$mxxfs7Fz2jVW6MvZr.MJL.C8Fv1lXEJEhkm4Jg.DaN3kDUWZlqmq6', '2000-10-09', '998812', 5000, 'client', 0),
('r@g.com', 'tion', 'tion', '$2a$10$xa4AS4d.Q66bbaHXXi4ASua5T/b6pqtGuTL33MeMR9SSM6RHbZ2b.', '1999-11-09', '22222', 0, 'receptionist', 0),
('teddy@g.com', 'teddy', 'teddy', '$2a$10$oN0hVCmULCOoBta5gOtAL.1LwC2YObqdNg7NnVxI8XnpCTPT1fjtW', '1992-08-30', '33521', 0, 'dokter', 0),
('temi@g.com', 'temi', 'temi', '$2a$10$ZS5oMCMHDOH8TqAg6y/JeOGZ8q0f4NnYn16DCL0/en0wTXgukG0FW', '1990-01-08', '99881', 0, 'dokter', 0),
('yoyo@g.com', 'yoyo', 'yoyo', '$2a$10$UhOEN3n4NDjaNOwiHF3Bk.S1bGdG4OKotC4Fph7xMxxIgTwDikyaa', '1998-08-09', '5645652', 4900, 'client', 3);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
