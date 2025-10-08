import React from 'react'
import SalesRevenueChart from '../../components/SalesRevenueChart'
function Admin_dashboard() {
    return (
        <>
            <div className="containerLeft">
                <div className='top'>
                    <div className='content1'>
                        <div className="logo">
                            LOGO
                        </div>
                        <div className="title">
                            Admin Dashboard
                        </div>
                        <div className="total">
                            Total Booking
                        </div>
                    </div>
                    <div className='content2'>
                        <div className="logo">
                            LOGO2
                        </div>
                        <div className="title">
                            Admin Dashboard2
                        </div>
                        <div className="total">
                            Total Booking2
                        </div>
                    </div>
                    <div className='content3'>
                        <div className="logo">
                            LOGO3
                        </div>
                        <div className="title">
                            Admin Dashboard3
                        </div>
                        <div className="total">
                            Total Booking3
                        </div>
                    </div>
                </div>
                <div className='bottom'>
                    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
                        <SalesRevenueChart />
                    </div>
                </div>
                <div className="middle">
                    <div className="content">

                    </div>
                </div>
            </div>
            <div className="containerRight">
                <div className='top'>

                </div>
                <div className='bottom'>

                </div>
            </div>



        </>

    )
}

export default Admin_dashboard