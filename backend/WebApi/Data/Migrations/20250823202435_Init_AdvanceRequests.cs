using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WebApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class Init_AdvanceRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblusuario",
                columns: table => new
                {
                    idusuario = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tipousuario = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblusuario", x => x.idusuario);
                });

            migrationBuilder.CreateTable(
                name: "tblcliente",
                columns: table => new
                {
                    idcliente = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    senha = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    usuarioid = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblcliente", x => x.idcliente);
                    table.ForeignKey(
                        name: "FK_tblcliente_tblusuario_usuarioid",
                        column: x => x.usuarioid,
                        principalTable: "tblusuario",
                        principalColumn: "idusuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tblcontrato",
                columns: table => new
                {
                    idcontrato = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nomecontrato = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    clienteid = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    vencimentocontrato = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    dataalteracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    datainsercao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    numeroparcelas = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblcontrato", x => x.idcontrato);
                    table.ForeignKey(
                        name: "FK_tblcontrato_tblcliente_clienteid",
                        column: x => x.clienteid,
                        principalTable: "tblcliente",
                        principalColumn: "idcliente",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tbladvancerequest",
                columns: table => new
                {
                    idadvancerequest = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    clienteid = table.Column<int>(type: "integer", nullable: false),
                    contratoid = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    createdat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    approvedat = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tbladvancerequest", x => x.idadvancerequest);
                    table.ForeignKey(
                        name: "FK_tbladvancerequest_tblcliente_clienteid",
                        column: x => x.clienteid,
                        principalTable: "tblcliente",
                        principalColumn: "idcliente",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tbladvancerequest_tblcontrato_contratoid",
                        column: x => x.contratoid,
                        principalTable: "tblcontrato",
                        principalColumn: "idcontrato",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tblparcelas",
                columns: table => new
                {
                    idparcela = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    numeroparcela = table.Column<int>(type: "integer", nullable: false),
                    valor = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    vencimento = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    contratoid = table.Column<int>(type: "integer", nullable: false),
                    clienteid = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblparcelas", x => x.idparcela);
                    table.ForeignKey(
                        name: "FK_tblparcelas_tblcliente_clienteid",
                        column: x => x.clienteid,
                        principalTable: "tblcliente",
                        principalColumn: "idcliente",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tblparcelas_tblcontrato_contratoid",
                        column: x => x.contratoid,
                        principalTable: "tblcontrato",
                        principalColumn: "idcontrato",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tbladvancerequestitem",
                columns: table => new
                {
                    idadvancerequestitem = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    advancerequestid = table.Column<int>(type: "integer", nullable: false),
                    parcelaid = table.Column<int>(type: "integer", nullable: false),
                    valornasolicitacao = table.Column<decimal>(type: "numeric(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tbladvancerequestitem", x => x.idadvancerequestitem);
                    table.ForeignKey(
                        name: "FK_tbladvancerequestitem_tbladvancerequest_advancerequestid",
                        column: x => x.advancerequestid,
                        principalTable: "tbladvancerequest",
                        principalColumn: "idadvancerequest",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_tbladvancerequestitem_tblparcelas_parcelaid",
                        column: x => x.parcelaid,
                        principalTable: "tblparcelas",
                        principalColumn: "idparcela",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tbladvancerequest_clienteid",
                table: "tbladvancerequest",
                column: "clienteid");

            migrationBuilder.CreateIndex(
                name: "IX_tbladvancerequest_contratoid",
                table: "tbladvancerequest",
                column: "contratoid");

            migrationBuilder.CreateIndex(
                name: "IX_tbladvancerequestitem_advancerequestid",
                table: "tbladvancerequestitem",
                column: "advancerequestid");

            migrationBuilder.CreateIndex(
                name: "IX_tbladvancerequestitem_parcelaid",
                table: "tbladvancerequestitem",
                column: "parcelaid");

            migrationBuilder.CreateIndex(
                name: "IX_tblcliente_email",
                table: "tblcliente",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tblcliente_usuarioid",
                table: "tblcliente",
                column: "usuarioid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tblcontrato_clienteid",
                table: "tblcontrato",
                column: "clienteid");

            migrationBuilder.CreateIndex(
                name: "IX_tblparcelas_clienteid",
                table: "tblparcelas",
                column: "clienteid");

            migrationBuilder.CreateIndex(
                name: "IX_tblparcelas_contratoid",
                table: "tblparcelas",
                column: "contratoid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tbladvancerequestitem");

            migrationBuilder.DropTable(
                name: "tbladvancerequest");

            migrationBuilder.DropTable(
                name: "tblparcelas");

            migrationBuilder.DropTable(
                name: "tblcontrato");

            migrationBuilder.DropTable(
                name: "tblcliente");

            migrationBuilder.DropTable(
                name: "tblusuario");
        }
    }
}
