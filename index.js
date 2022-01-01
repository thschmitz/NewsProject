const express = require('express');
const mongoose = require("mongoose")
var bodyParser = require("body-parser")
const fs = require("fs")
const path = require("path")
const app = express();
const fileupload = require("express-fileupload")
const Posts = require("./Posts.js")

var session = require("express-session") // sessao fixada

mongoose.connect("mongodb+srv://root:uN8HRyTYQ9nc268v@cluster0.aqlj3.mongodb.net/dankicode?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology:true}).then(function(){
    console.log("Conectado com sucesso");      // Conexao com o banco de dados
}).catch(function(err){
    console.log(err.message);
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

                   // senha da sessao          
app.use(session({secret: "keyboard cat", cookie: {maxAge: 60000}}))



app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use("/public", express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "/pages"));

app.get('/', (req, res)=>{
    console.log(req.query)

    if(req.query.busca == null){
        Posts.find({}).sort({"_id": -1}).exec(function(err, posts){
            posts = posts.map(function(val){
                return{
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria
                }
            })

            Posts.find({}).sort({"views": -1}).limit(3).exec(function(err, postsTop){
                postsTop = postsTop.map(function(val){
                    return{
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 100), // Pegar somente os 100 primeiros caracteres da mensagem
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views
                    }
                })
                res.render("home", {posts: posts, postsTop:postsTop})

            })

        })
    }else{
        Posts.find({titulo: {$regex: req.query.busca, $options: "i"}}, function(err, posts){
            console.log(posts)
            posts = posts.map(function(val){
                return{
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0, 100), // Pegar somente os 100 primeiros caracteres da mensagem
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria,
                    views: val.views
                }
            })
            res.render("busca", {posts: posts, contagem: posts.length})
        })
    }
});


app.get("/:slug", (req, res)=>{
    Posts.findOneAndUpdate({slug: req.params.slug}, {$inc:{views: 1}}, {new:true}, function(err, resposta){
        if(resposta != null){

            Posts.find({}).sort({"views": -1}).limit(3).exec(function(err, postsTop){
                postsTop = postsTop.map(function(val){
                    return{
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 100), // Pegar somente os 100 primeiros caracteres da mensagem
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views,
                        date: val.date
                    }
                })
                res.render("single", {noticia: resposta, postsTop:postsTop})
            })
        }else{
            res.redirect("/")
        }
    })
})

var usuarios = [
    {
        login: "thomas",
        senha: "123456"
    }
]

app.post("/admin/login", (req, res)=>{
    usuarios.map(function(val){
        if (val.login == req.body.login &&  val.senha == req.body.senha){
            req.session.login = "thomas" // Tirou do null
        }
    })
    res.redirect("/admin/login")
})

app.post("/admin/cadastro", (req, res)=>{
    var dateTime = require('node-datetime');
    var dt = dateTime.create();
    var formatted = dt.format('d-m-Y');
    Posts.create({
        titulo:req.body.titulo_noticia,
        imagem: req.body.url_imagem,
        categoria: 'Nenhuma',
        conteudo: req.body.noticia,
        slug: req.body.slug,
        autor: "Admin",
        views: 0,
        date: formatted
    });

    res.redirect("/admin/login")

})

app.get("/admin/deletar/:id", (req, res)=>{
    Posts.deleteOne({_id:req.params.id}).then(function(){
        res.redirect("/admin/login");
    })
})

app.get("/admin/login", (req, res)=>{

    if (req.session.login == null){
        res.render("admin-login")
    }else{
        Posts.find({}).sort({"_id": -1}).exec(function(err, posts){
            posts = posts.map(function(val){
                return{
                    id: val._id,
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0,100),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria,
                }
            })
            res.render("admin-painel", {posts:posts})

        })

    }
})

app.listen(3000,()=>{
    console.log("Server rodando!");
})